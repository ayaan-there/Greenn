// aptos-client.js - Injected script for Petra wallet interaction
(function() {
  'use strict';

  // Prevent multiple loads/listeners if injected more than once
  if (window.__GREEN_POINTS_CLIENT_READY__) {
    console.log('Green Points: Aptos client already initialized');
    return;
  }
  window.__GREEN_POINTS_CLIENT_READY__ = true;

  console.log('Green Points: Aptos client script loaded');

  const APTOS_RPC = 'https://fullnode.devnet.aptoslabs.com/v1';
  async function waitForTxn(hash, timeoutMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const r = await fetch(`${APTOS_RPC}/transactions/by_hash/${hash}`);
        if (r.status === 404) {
          // not indexed yet
        } else if (r.ok) {
          const tx = await r.json();
          if (tx.type === 'user_transaction' || tx.type === 'state_checkpoint_transaction') {
            return { confirmed: true, success: !!tx.success, vm_status: tx.vm_status || '', version: tx.version };
          }
        }
      } catch {}
      await new Promise(res => setTimeout(res, 800));
    }
    return { confirmed: false, success: false, vm_status: 'timeout waiting for transaction' };
  }


  // Check if Petra wallet is available (poll up to ~10s)
  function checkWallet() {
    return new Promise((resolve) => {
      const maxTries = 20; // 20 * 500ms = 10s
      let tries = 0;
      const tick = () => {
        if (window.aptos) {
          console.log('Green Points: Petra wallet found');
          resolve(true);
          return;
        }
        tries += 1;
        if (tries >= maxTries) {
          console.log('Green Points: Petra wallet not found after waiting');
          resolve(false);
          return;
        }
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  // Cache for coin decimals per admin coin type
  const coinDecimalsCache = new Map();

  async function getCoinDecimals(adminAddr) {
    const coinKey = `${adminAddr}::green_points::GreenPoints`;
    if (coinDecimalsCache.has(coinKey)) return coinDecimalsCache.get(coinKey);

    try {
      // Prefer view function for decimals to work across coin-v1/v2
      const viewResp = await fetch(`${APTOS_RPC}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::coin::decimals',
          type_arguments: [coinKey],
          arguments: []
        })
      });
      if (!viewResp.ok) throw new Error(`HTTP ${viewResp.status}`);
      const arr = await viewResp.json();
      const decimals = Number(arr[0] ?? 8);
      coinDecimalsCache.set(coinKey, decimals);
      return decimals;
    } catch (e) {
      // Fallback to CoinInfo resource
      try {
        const resourceType = `0x1::coin::CoinInfo<${coinKey}>`;
        const url = `${APTOS_RPC}/accounts/${adminAddr}/resource/${encodeURIComponent(resourceType)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const info = await resp.json();
        const decimals = Number(info.data.decimals ?? 8);
        coinDecimalsCache.set(coinKey, decimals);
        return decimals;
      } catch (e2) {
        console.warn('Green Points: Failed to get decimals, defaulting to 8:', e, e2);
        coinDecimalsCache.set(coinKey, 8);
        return 8;
      }
    }
  }

  async function viewBalance(adminAddr, studentAddr) {
    const coinType = `${adminAddr}::green_points::GreenPoints`;
    try {
      const resp = await fetch(`${APTOS_RPC}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: '0x1::coin::balance',
          type_arguments: [coinType],
          arguments: [studentAddr]
        })
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const out = await resp.json();
      if (!Array.isArray(out) || out.length === 0) throw new Error('empty view response');
      return BigInt(out[0]);
    } catch (err) {
      console.warn('Green Points: view balance failed, will fallback to CoinStore:', err);
      return null;
    }
  }

  async function getBalance(adminAddr, studentAddr) {
    try {
      console.log('Green Points: Checking balance for', studentAddr);
      // First try the view function (works across coin-v1/v2)
      const vb = await viewBalance(adminAddr, studentAddr);
      if (vb !== null) {
        const decimals = await getCoinDecimals(adminAddr);
        const divisor = 10n ** BigInt(decimals);
        const whole = vb / divisor;
        const frac = vb % divisor;
        const balance = Number(whole) + Number(frac) / Number(divisor);
        return { success: true, balance, raw: vb.toString(), decimals, hasStore: null };
      }

      // Fallback to CoinStore resource
      const coinType = `${adminAddr}::green_points::GreenPoints`;
      const resourceType = `0x1::coin::CoinStore<${coinType}>`;
      const url = `${APTOS_RPC}/accounts/${studentAddr}/resource/${encodeURIComponent(resourceType)}`;
      console.log('Green Points: Fetching CoinStore from URL:', url);
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Green Points: User not registered or no CoinStore');
          const decimals = await getCoinDecimals(adminAddr);
          return { success: true, balance: 0, raw: '0', decimals, hasStore: false };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawBalance = BigInt(data.data.coin.value);
      const decimals = await getCoinDecimals(adminAddr);
      const divisor = 10n ** BigInt(decimals);
      const whole = rawBalance / divisor;
      const frac = rawBalance % divisor;
      const balance = Number(whole) + Number(frac) / Number(divisor);

      console.log('Green Points: Balance found:', balance);
      return { success: true, balance, raw: rawBalance.toString(), decimals, hasStore: true };
    } catch (error) {
      console.error('Green Points: Balance error:', error);
      return { success: false, error: error.message };
    }
  }

  async function awardPoints(adminAddr, studentAddr, amount) {
    try {
      const walletAvailable = await checkWallet();
      if (!walletAvailable) {
        throw new Error('Petra wallet not found. Please install Petra wallet extension from Chrome Web Store.');
      }

      const payload = {
        type: "entry_function_payload",
        function: `${adminAddr}::green_points::award`,
        type_arguments: [],
        arguments: [studentAddr, amount.toString()]
      };

      const result = await window.aptos.signAndSubmitTransaction(payload);
      const status = await waitForTxn(result.hash);
      if (!status.confirmed) {
        return { success: false, error: `Transaction not confirmed: ${status.vm_status}`, hash: result.hash };
      }
      if (!status.success) {
        return { success: false, error: `Transaction failed: ${status.vm_status}`, hash: result.hash };
      }
      return { success: true, hash: result.hash };
    } catch (error) {
      console.error('Green Points: Award error:', error);
      const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
      return { success: false, error: message };
    }
  }

  async function redeemPoints(adminAddr, studentAddr, amount) {
    try {
      const walletAvailable = await checkWallet();
      if (!walletAvailable) {
        throw new Error('Petra wallet not found. Please install Petra wallet extension from Chrome Web Store.');
      }

      const payload = {
        type: "entry_function_payload",
        function: `${adminAddr}::green_points::redeem_from`,
        type_arguments: [],
        arguments: [adminAddr, studentAddr, amount.toString()]
      };

      const result = await window.aptos.signAndSubmitTransaction(payload);
      const status = await waitForTxn(result.hash);
      if (!status.confirmed) {
        return { success: false, error: `Transaction not confirmed: ${status.vm_status}`, hash: result.hash };
      }
      if (!status.success) {
        return { success: false, error: `Transaction failed: ${status.vm_status}`, hash: result.hash };
      }
      return { success: true, hash: result.hash };
    } catch (error) {
      console.error('Green Points: Redeem error:', error);
      const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
      return { success: false, error: message };
    }
  }

  async function registerStudent(adminAddr) {
    try {
      const walletAvailable = await checkWallet();
      if (!walletAvailable) {
        throw new Error('Petra wallet not found. Please install Petra wallet extension from Chrome Web Store.');
      }

      const payload = {
        type: "entry_function_payload",
        function: `${adminAddr}::green_points::register`,
        type_arguments: [],
        arguments: []
      };

      const result = await window.aptos.signAndSubmitTransaction(payload);
      const status = await waitForTxn(result.hash);
      if (!status.confirmed) {
        return { success: false, error: `Transaction not confirmed: ${status.vm_status}`, hash: result.hash };
      }
      if (!status.success) {
        return { success: false, error: `Transaction failed: ${status.vm_status}`, hash: result.hash };
      }
      return { success: true, hash: result.hash };
    } catch (error) {
      console.error('Green Points: Register error:', error);
      const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
      return { success: false, error: message };
    }
  }

  async function setMerchant(adminAddr, merchantAddr, approved) {
    try {
      const walletAvailable = await checkWallet();
      if (!walletAvailable) {
        throw new Error('Petra wallet not found. Please install Petra wallet extension from Chrome Web Store.');
      }

      const payload = {
        type: "entry_function_payload",
        function: `${adminAddr}::green_points::set_merchant`,
        type_arguments: [],
        arguments: [merchantAddr, approved]
      };

      const result = await window.aptos.signAndSubmitTransaction(payload);
      const status = await waitForTxn(result.hash);
      if (!status.confirmed) {
        return { success: false, error: `Transaction not confirmed: ${status.vm_status}`, hash: result.hash };
      }
      if (!status.success) {
        return { success: false, error: `Transaction failed: ${status.vm_status}`, hash: result.hash };
      }
      return { success: true, hash: result.hash };
    } catch (error) {
      console.error('Green Points: Set merchant error:', error);
      const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
      return { success: false, error: message };
    }
  }

  async function connectWallet() {
    try {
      const walletAvailable = await checkWallet();
      if (!walletAvailable) {
        throw new Error('Petra wallet not found.');
      }
      // Note: `isConnected` may not be reliable. `connect` handles both connection and retrieval.
      const response = await window.aptos.connect();
      const network = await window.aptos.network();
      return { success: true, message: `Connected to ${network}`, account: response.address };
    } catch (error) {
      console.error('Green Points: Connect error:', error);
      // Petra uses code 4100 for user rejection, which is non-standard. EIP-1193 uses 4001.
      if (error.code === 4100 || error.code === 4001) {
        return { success: false, error: 'Connection rejected by user.' };
      }
      const message = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
      return { success: false, error: message };
    }
  }

  // Listen for messages from content script
  window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data.type !== 'EXTENSION_MESSAGE') return;

    const { data: message } = event.data;
    console.log('Green Points: Processing message:', message.type);
    let response;

    switch (message.type) {
      case 'CONNECT_WALLET':
        console.log('Green Points: Connecting wallet...');
        response = await connectWallet();
        break;

      case 'GET_BALANCE':
        console.log('Green Points: Getting balance...');
        response = await getBalance(message.adminAddr, message.studentAddr);
        break;
      
      case 'AWARD_POINTS':
        console.log('Green Points: Awarding points...');
        response = await awardPoints(message.adminAddr, message.studentAddr, message.amount);
        break;
      
      case 'REDEEM_POINTS':
        console.log('Green Points: Redeeming points...');
        response = await redeemPoints(message.adminAddr, message.studentAddr, message.amount);
        break;
      
      case 'REGISTER_STUDENT':
        console.log('Green Points: Registering student...');
        response = await registerStudent(message.adminAddr);
        break;

      case 'SET_MERCHANT':
        console.log('Green Points: Setting merchant...');
        response = await setMerchant(message.adminAddr, message.merchantAddr, message.approved);
        break;

      default:
        console.log('Green Points: Unknown message type:', message.type);
        response = { success: false, error: 'Unknown message type' };
    }

    console.log('Green Points: Sending response:', response);
    // Send response back to content script
    window.postMessage({
      type: 'PAGE_RESPONSE',
      response
    }, '*');
  });

  console.log('Green Points: Message listener ready');
})();
