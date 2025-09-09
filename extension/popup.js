// popup.js - Chrome Extension Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const adminAddr = document.getElementById('adminAddr');
  const studentAddr = document.getElementById('studentAddr');
  const balanceDisplay = document.getElementById('balanceDisplay');
  const awardAmount = document.getElementById('awardAmount');
  const redeemAmount = document.getElementById('redeemAmount');
  const merchantAddr = document.getElementById('merchantAddr');
  const status = document.getElementById('status');
  const pageInfo = document.getElementById('pageInfo');
  const walletStatus = document.getElementById('walletStatus');

  // Check current page compatibility
  let pageCompatible = true;
  const actionButtons = [
    'connectWalletBtn', 'checkBalance', 'awardBtn', 'redeemBtn',
    'registerStudentBtn', 'addMerchantBtn', 'removeMerchantBtn'
  ].map(id => document.getElementById(id));

  let injectedThisOpen = false;
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url;
      const isCompatible = !url.startsWith('chrome://') && 
                          !url.startsWith('chrome-extension://') &&
                          !url.startsWith('edge://') &&
                          !url.startsWith('about:');
      
      if (isCompatible) {
        pageCompatible = true;
        pageInfo.textContent = '✅ Page compatible with extension';
        pageInfo.style.color = '#4caf50';
        // Proactively inject content and client to ensure receiver exists
        try {
          if (!injectedThisOpen) {
            injectedThisOpen = true;
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id, allFrames: true },
              files: ['content.js']
            });
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['aptos-client.js'],
              world: 'MAIN'
            });
          }
        } catch (e) {
          console.warn('Green Points Popup: Pre-injection failed:', e);
        }
      } else {
        pageCompatible = false;
        pageInfo.innerHTML = '⚠️ Limited features on this page<br>For full features, visit a regular website';
        pageInfo.style.color = '#ff9800';
        // Disable action buttons on incompatible pages
        actionButtons.forEach(btn => btn && (btn.disabled = true));
      }
    }
  });

  // Load saved addresses
  chrome.storage.sync.get(['adminAddr', 'studentAddr', 'merchantAddr'], (data) => {
    if (data.adminAddr) adminAddr.value = data.adminAddr;
    if (data.studentAddr) studentAddr.value = data.studentAddr;
    if (data.merchantAddr) merchantAddr.value = data.merchantAddr;
  });

  // Save addresses on change
  [adminAddr, studentAddr, merchantAddr].forEach(input => {
    input.addEventListener('change', () => {
      chrome.storage.sync.set({
        adminAddr: adminAddr.value,
        studentAddr: studentAddr.value,
        merchantAddr: merchantAddr.value
      });
    });
  });

  // Connect to Wallet
  document.getElementById('connectWalletBtn').addEventListener('click', async () => {
    showStatus('Connecting to Petra wallet...');
    const response = await sendMessageToContent({
      type: 'CONNECT_WALLET'
    });

    if (response && response.success) {
      const network = typeof response.message === 'string' ? (response.message.split(' ').pop() || 'network') : 'network';
      const acct = response.account || '';
      showStatus(`Successfully connected to ${network}`, false);
      walletStatus.textContent = acct ? `Connected: ${acct.slice(0, 6)}... on ${network}` : `Connected on ${network}`;
      walletStatus.style.color = '#4caf50';
    } else {
      showStatus(response?.error || 'Failed to connect wallet', true);
      walletStatus.textContent = 'Connection Failed';
      walletStatus.style.color = '#d32f2f';
    }
  });

  function showStatus(message, isError = false) {
    console.log('Green Points Popup:', message);
    status.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => status.innerHTML = '', 10000); // Increased timeout for long errors
  }

  let busy = false;

  function sendMessageToContent(message) {
    console.log('Green Points Popup: Sending message:', message);
    return new Promise((resolve) => {
      if (busy) {
        showStatus('Please wait for the current operation to finish...', true);
        resolve({ success: false, error: 'Busy' });
        return;
      }
      busy = true;
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) {
          showStatus('No active tab found', true);
          busy = false;
          resolve(null);
          return;
        }

        const currentTab = tabs[0];
        console.log('Green Points Popup: Current tab URL:', currentTab.url);
        
        // Check if we can inject content script on this page
        if (currentTab.url.startsWith('chrome://') || 
            currentTab.url.startsWith('chrome-extension://') ||
            currentTab.url.startsWith('edge://') ||
            currentTab.url.startsWith('about:')) {
          
          // For balance check, we can do it directly without content script
          if (message.type === 'GET_BALANCE') {
            handleBalanceDirectly(message.adminAddr, message.studentAddr)
              .then(resolve)
              .catch(() => resolve({ success: false, error: 'Direct balance check failed' }))
              .finally(() => { busy = false; });
            return;
          }
          
          showStatus('Extension cannot run on this page. Please open a regular website.', true);
          resolve({ success: false, error: 'Cannot inject content script on this page type' });
          return;
        }
        
        chrome.tabs.sendMessage(currentTab.id, message, async (response) => {
          if (chrome.runtime.lastError) {
            console.error('Green Points Popup: Runtime error:', chrome.runtime.lastError.message);
            
            // If content script failed, try direct balance check as fallback
            if (message.type === 'GET_BALANCE') {
              console.log('Green Points Popup: Falling back to direct balance check');
              handleBalanceDirectly(message.adminAddr, message.studentAddr)
                .then(resolve)
                .catch(() => resolve({ success: false, error: 'Content script and direct check both failed' }))
                .finally(() => { busy = false; });
              return;
            } else {
              // Try to programmatically inject the content script, then retry once
              try {
                // Inject content script (isolated world)
                await chrome.scripting.executeScript({
                  target: { tabId: currentTab.id, allFrames: true },
                  files: ['content.js']
                });

                // Also inject aptos-client into the page MAIN world to avoid CSP blocking of tag injection
                await chrome.scripting.executeScript({
                  target: { tabId: currentTab.id },
                  files: ['aptos-client.js'],
                  world: 'MAIN'
                });

                console.log('Green Points Popup: Injected content.js and aptos-client.js dynamically, retrying message');
                chrome.tabs.sendMessage(currentTab.id, message, (resp2) => {
                  if (chrome.runtime.lastError) {
                    console.error('Green Points Popup: Retry failed:', chrome.runtime.lastError.message);
                    showStatus('Content script not loaded. Try reloading the extension and the page.', true);
                      resolve({ success: false, error: 'Content script not loaded. Use the "Reload" button.' });
                      busy = false;
                  } else {
                    console.log('Green Points Popup: Received response (after inject):', resp2);
                      resolve(resp2);
                      busy = false;
                  }
                });
              } catch (injectErr) {
                console.error('Green Points Popup: Injection failed:', injectErr);
                showStatus('Content script injection failed. Reload the page and try again.', true);
                  resolve({ success: false, error: 'Content script injection failed' });
                  busy = false;
              }
            }
          } else {
            console.log('Green Points Popup: Received response:', response);
              resolve(response);
              busy = false;
          }
        });
      });
    });
  }

  // Direct balance check function (fallback when content script fails)
  async function handleBalanceDirectly(adminAddr, studentAddr) {
    try {
      console.log('Green Points Popup: Direct balance check for', studentAddr);
      const rpc = 'https://fullnode.devnet.aptoslabs.com/v1';
      const coinType = `${adminAddr}::green_points::GreenPoints`;
      const resourceType = `0x1::coin::CoinStore<${coinType}>`;
      const url = `${rpc}/accounts/${studentAddr}/resource/${encodeURIComponent(resourceType)}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          // Not registered or no store
          let decimals = 8;
          try {
            const ciType = `0x1::coin::CoinInfo<${coinType}>`;
            const ciUrl = `${rpc}/accounts/${adminAddr}/resource/${encodeURIComponent(ciType)}`;
            const ciResp = await fetch(ciUrl);
            if (ciResp.ok) { const ci = await ciResp.json(); decimals = Number(ci.data.decimals ?? 8); }
          } catch {}
          return { success: true, balance: 0, raw: '0', decimals, hasStore: false };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Try to fetch CoinInfo for decimals, default to 8 if fails
      let decimals = 8;
      try {
        const ciType = `0x1::coin::CoinInfo<${coinType}>`;
        const ciUrl = `${rpc}/accounts/${adminAddr}/resource/${encodeURIComponent(ciType)}`;
        const ciResp = await fetch(ciUrl);
        if (ciResp.ok) {
          const ci = await ciResp.json();
          decimals = Number(ci.data.decimals ?? 8);
        }
      } catch {}

  const rawBalance = BigInt(data.data.coin.value);
      const divisor = 10n ** BigInt(decimals);
      const whole = rawBalance / divisor;
      const frac = rawBalance % divisor;
      const balance = Number(whole) + Number(frac) / Number(divisor);

  return { success: true, balance, raw: rawBalance.toString(), decimals, hasStore: true };
    } catch (error) {
      console.error('Green Points Popup: Direct balance error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check Balance
  document.getElementById('checkBalance').addEventListener('click', async () => {
    const response = await sendMessageToContent({
      type: 'GET_BALANCE',
      adminAddr: adminAddr.value,
      studentAddr: studentAddr.value
    });

    if (response && response.success) {
      balanceDisplay.textContent = `${response.balance} GPNT`;
      if (!response.hasStore) {
        showStatus('No CoinStore found for this student. Click "Register as Student" with that wallet, then re-award.', true);
      }
    } else {
      balanceDisplay.textContent = '--';
      showStatus(response?.error || 'Failed to get balance', true);
    }
  });

  // Award Points
  document.getElementById('awardBtn').addEventListener('click', async () => {
    const amount = parseInt(awardAmount.value);
    if (!amount || amount <= 0) {
      showStatus('Please enter a valid amount', true);
      return;
    }

    showStatus('Awarding points...');
    const response = await sendMessageToContent({
      type: 'AWARD_POINTS',
      adminAddr: adminAddr.value,
      studentAddr: studentAddr.value,
      amount
    });

    if (response && response.success) {
      const tx = response.hash ? `${response.hash.slice(0, 10)}...` : '';
      showStatus(`Successfully awarded ${amount} points!${tx ? ' Tx: ' + tx : ''}`);
      // Refresh balance
      document.getElementById('checkBalance').click();
    } else {
      showStatus(response?.error || 'Failed to award points', true);
    }
  });

  // Redeem Points
  document.getElementById('redeemBtn').addEventListener('click', async () => {
    const amount = parseInt(redeemAmount.value);
    if (!amount || amount <= 0) {
      showStatus('Please enter a valid amount', true);
      return;
    }

    showStatus('Redeeming points...');
    const response = await sendMessageToContent({
      type: 'REDEEM_POINTS',
      adminAddr: adminAddr.value,
      studentAddr: studentAddr.value,
      amount
    });

    if (response && response.success) {
      const tx = response.hash ? `${response.hash.slice(0, 10)}...` : '';
      showStatus(`Successfully redeemed ${amount} points!${tx ? ' Tx: ' + tx : ''}`);
      // Refresh balance
      document.getElementById('checkBalance').click();
    } else {
      showStatus(response?.error || 'Failed to redeem points', true);
    }
  });

  // Register Student
  document.getElementById('registerStudentBtn').addEventListener('click', async () => {
    showStatus('Registering student...');
    const response = await sendMessageToContent({
      type: 'REGISTER_STUDENT',
      adminAddr: adminAddr.value
    });

    if (response && response.success) {
      const tx = response.hash ? `${response.hash.slice(0, 10)}...` : '';
      showStatus(`Successfully registered!${tx ? ' Tx: ' + tx : ''}`);
    } else {
      showStatus(response?.error || 'Failed to register', true);
    }
  });

  // Add Merchant
  document.getElementById('addMerchantBtn').addEventListener('click', async () => {
    const merchant = merchantAddr.value;
    if (!merchant) {
      showStatus('Please enter a merchant address', true);
      return;
    }

    showStatus('Adding merchant...');
    const response = await sendMessageToContent({
      type: 'SET_MERCHANT',
      adminAddr: adminAddr.value,
      merchantAddr: merchant,
      approved: true
    });

    if (response && response.success) {
      const tx = response.hash ? `${response.hash.slice(0, 10)}...` : '';
      showStatus(`Successfully added merchant!${tx ? ' Tx: ' + tx : ''}`);
    } else {
      showStatus(response?.error || 'Failed to add merchant', true);
    }
  });

  // Remove Merchant
  document.getElementById('removeMerchantBtn').addEventListener('click', async () => {
    const merchant = merchantAddr.value;
    if (!merchant) {
      showStatus('Please enter a merchant address', true);
      return;
    }

    showStatus('Removing merchant...');
    const response = await sendMessageToContent({
      type: 'SET_MERCHANT',
      adminAddr: adminAddr.value,
      merchantAddr: merchant,
      approved: false
    });

    if (response && response.success) {
      const tx = response.hash ? `${response.hash.slice(0, 10)}...` : '';
      showStatus(`Successfully removed merchant!${tx ? ' Tx: ' + tx : ''}`);
    } else {
      showStatus(response?.error || 'Failed to remove merchant', true);
    }
  });
  // Reload extension and tab
  document.getElementById('reloadExtensionBtn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
    chrome.runtime.reload();
  });
});
