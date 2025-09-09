// popup.js - Chrome Extension Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const adminAddr = document.getElementById('adminAddr');
  const studentAddr = document.getElementById('studentAddr');
  const balanceDisplay = document.getElementById('balanceDisplay');
  const awardAmount = document.getElementById('awardAmount');
  const redeemAmount = document.getElementById('redeemAmount');
  const status = document.getElementById('status');
  const pageInfo = document.getElementById('pageInfo');

  // Check current page compatibility
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      const url = tabs[0].url;
      const isCompatible = !url.startsWith('chrome://') && 
                          !url.startsWith('chrome-extension://') &&
                          !url.startsWith('edge://') &&
                          !url.startsWith('about:');
      
      if (isCompatible) {
        pageInfo.textContent = '✅ Page compatible with extension';
        pageInfo.style.color = '#4caf50';
      } else {
        pageInfo.innerHTML = '⚠️ Limited features on this page<br>For full features, visit a regular website';
        pageInfo.style.color = '#ff9800';
      }
    }
  });

  // Load saved addresses
  chrome.storage.sync.get(['adminAddr', 'studentAddr'], (data) => {
    if (data.adminAddr) adminAddr.value = data.adminAddr;
    if (data.studentAddr) studentAddr.value = data.studentAddr;
  });

  // Save addresses on change
  [adminAddr, studentAddr].forEach(input => {
    input.addEventListener('change', () => {
      chrome.storage.sync.set({
        adminAddr: adminAddr.value,
        studentAddr: studentAddr.value
      });
    });
  });

  function showStatus(message, isError = false) {
    console.log('Green Points Popup:', message);
    status.innerHTML = `<div class="${isError ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => status.innerHTML = '', 5000);
  }

  function sendMessageToContent(message) {
    console.log('Green Points Popup: Sending message:', message);
    return new Promise((resolve) => {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0]) {
          showStatus('No active tab found', true);
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
              .catch(() => resolve({ success: false, error: 'Direct balance check failed' }));
            return;
          }
          
          showStatus('Extension cannot run on this page. Please open a regular website.', true);
          resolve({ success: false, error: 'Cannot inject content script on this page type' });
          return;
        }
        
        chrome.tabs.sendMessage(currentTab.id, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Green Points Popup: Runtime error:', chrome.runtime.lastError.message);
            
            // If content script failed, try direct balance check as fallback
            if (message.type === 'GET_BALANCE') {
              console.log('Green Points Popup: Falling back to direct balance check');
              handleBalanceDirectly(message.adminAddr, message.studentAddr)
                .then(resolve)
                .catch(() => resolve({ success: false, error: 'Content script and direct check both failed' }));
            } else {
              showStatus('Content script not loaded. Try refreshing the page.', true);
              resolve(null);
            }
          } else {
            console.log('Green Points Popup: Received response:', response);
            resolve(response);
          }
        });
      });
    });
  }

  // Direct balance check function (fallback when content script fails)
  async function handleBalanceDirectly(adminAddr, studentAddr) {
    try {
      console.log('Green Points Popup: Direct balance check for', studentAddr);
      const coinType = `${adminAddr}::green_points::GreenPoints`;
      const encodedCoinType = encodeURIComponent(coinType);
      const resourceType = `0x1::coin::CoinStore<${encodedCoinType}>`;
      const url = `https://fullnode.mainnet.aptoslabs.com/v1/accounts/${studentAddr}/resource/${encodeURIComponent(resourceType)}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, balance: 0 }; // Not registered
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawBalance = parseInt(data.data.coin.value);
      const balance = rawBalance / Math.pow(10, 8);
      
      return { success: true, balance };
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
      showStatus(`Successfully awarded ${amount} points!`);
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
      showStatus(`Successfully redeemed ${amount} points!`);
      // Refresh balance
      document.getElementById('checkBalance').click();
    } else {
      showStatus(response?.error || 'Failed to redeem points', true);
    }
  });
});
