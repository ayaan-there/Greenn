// aptos-client.js - Injected script for Petra wallet interaction
(function() {
  'use strict';

  console.log('Green Points: Aptos client script loaded');

  const APTOS_RPC = 'https://fullnode.mainnet.aptoslabs.com/v1';

  // Check if Petra wallet is available
  function checkWallet() {
    return new Promise((resolve) => {
      if (window.aptos) {
        console.log('Green Points: Petra wallet found');
        resolve(true);
      } else {
        console.log('Green Points: Waiting for Petra wallet...');
        setTimeout(() => {
          if (window.aptos) {
            console.log('Green Points: Petra wallet found after wait');
            resolve(true);
          } else {
            console.log('Green Points: Petra wallet not found');
            resolve(false);
          }
        }, 2000);
      }
    });
  }

  async function getBalance(adminAddr, studentAddr) {
    try {
      console.log('Green Points: Checking balance for', studentAddr);
      const coinType = `${adminAddr}::green_points::GreenPoints`;
      const encodedCoinType = encodeURIComponent(coinType);
      const resourceType = `0x1::coin::CoinStore<${encodedCoinType}>`;
      const url = `${APTOS_RPC}/accounts/${studentAddr}/resource/${encodeURIComponent(resourceType)}`;
      
      console.log('Green Points: Fetching from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Green Points: User not registered or no balance');
          return { success: true, balance: 0 }; // Not registered yet
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawBalance = parseInt(data.data.coin.value);
      const balance = rawBalance / Math.pow(10, 8); // 8 decimals
      
      console.log('Green Points: Balance found:', balance);
      return { success: true, balance };
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
      return { success: true, hash: result.hash };
    } catch (error) {
      return { success: false, error: error.message };
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
      return { success: true, hash: result.hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Listen for messages from content script
  window.addEventListener('message', async (event) => {
    if (event.source !== window || event.data.type !== 'EXTENSION_MESSAGE') return;

    const { data: message } = event.data;
    console.log('Green Points: Processing message:', message.type);
    let response;

    switch (message.type) {
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
