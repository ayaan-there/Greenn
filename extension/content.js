// content.js - Content Script Bridge
(function() {
  'use strict';

  console.log('Green Points: Content script loaded');

  // Inject aptos-client.js into page context
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('aptos-client.js');
  script.onload = function() {
    console.log('Green Points: Aptos client script injected');
    this.remove();
  };
  script.onerror = function() {
    console.error('Green Points: Failed to inject aptos client script');
  };
  (document.head || document.documentElement).appendChild(script);

  // Message passing between popup and injected script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Green Points: Received message from popup:', message);
    
    // Forward message to page context
    window.postMessage({
      type: 'EXTENSION_MESSAGE',
      data: message
    }, '*');

    // Listen for response from page context
    const responseHandler = (event) => {
      if (event.source !== window || event.data.type !== 'PAGE_RESPONSE') return;
      
      console.log('Green Points: Received response from page:', event.data.response);
      window.removeEventListener('message', responseHandler);
      sendResponse(event.data.response);
    };

    window.addEventListener('message', responseHandler);
    
    // Set timeout for response
    setTimeout(() => {
      window.removeEventListener('message', responseHandler);
      console.log('Green Points: Message timeout');
      sendResponse({ success: false, error: 'Timeout waiting for response' });
    }, 10000);
    
    // Keep message channel open
    return true;
  });
})();
