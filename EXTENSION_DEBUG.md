# 🔧 Green Points Extension Debug Guide

## Step 1: Basic Extension Test

1. **Load the test extension first**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `/Users/geu/Greenn/extension/`
   - **Temporarily rename** `manifest.json` to `manifest-main.json`
   - **Rename** `manifest-test.json` to `manifest.json`
   - Click "Reload" on the extension

2. **Test basic functionality**:
   - Click the extension icon
   - Click "Test Extension" button
   - You should see the timestamp update

## Step 2: Check Main Extension

1. **Switch back to main extension**:
   - Rename `manifest.json` to `manifest-test.json`
   - Rename `manifest-main.json` to `manifest.json`
   - Click "Reload" on the extension

2. **Debug the main extension**:
   - Click the extension icon
   - Right-click the icon → "Inspect popup"
   - Look for console logs starting with "Green Points Popup:"

## Step 3: Content Script Debug

1. **Open the test page**:
   - Go to `file:///Users/geu/Greenn/test-extension.html`
   - Open DevTools (F12)
   - Look for console logs starting with "Green Points:"

2. **Check content script injection**:
   - In DevTools, go to Sources tab
   - Look for injected scripts
   - Should see `content.js` and `aptos-client.js`

## Step 4: Common Issues & Solutions

### Issue: Buttons don't respond
**Solution**: Check popup console for errors

### Issue: "No active tab found"
**Solution**: Make sure you're on a webpage, not chrome:// pages

### Issue: Content script not loading
**Solution**: Check extension permissions and reload

### Issue: Petra wallet not found
**Solution**: Install Petra wallet extension

## Step 5: Manual Test Commands

In the popup console, try:
```javascript
// Test chrome.tabs API
chrome.tabs.query({active: true, currentWindow: true}, console.log);

// Test storage API
chrome.storage.sync.set({test: 'works'}, () => console.log('Storage works'));
```

## Quick Test Script

Run this in popup console:
```javascript
console.log('Testing extension...');
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  console.log('Active tab:', tabs[0]?.url);
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'TEST'}, (response) => {
      console.log('Response:', response);
      console.log('Error:', chrome.runtime.lastError);
    });
  }
});
```
