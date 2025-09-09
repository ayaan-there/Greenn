// Simple test popup - popup-test.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Green Points Test Popup: Loaded');
  
  const testBtn = document.getElementById('testBtn');
  const result = document.getElementById('result');
  
  testBtn.addEventListener('click', () => {
    console.log('Green Points Test Popup: Button clicked');
    result.textContent = 'Button works! ' + new Date().toLocaleTimeString();
    
    // Test chrome.tabs API
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      console.log('Green Points Test Popup: Active tab:', tabs[0]?.url);
      result.textContent += ' | Tab: ' + (tabs[0]?.url || 'No tab');
    });
  });
});
