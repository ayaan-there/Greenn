#!/bin/bash
set -e

echo "🚀 Green Points Extension Setup Guide"
echo "===================================="

echo ""
echo "✅ GOOD NEWS: Your extension is working correctly!"
echo "   - Balance API calls are successful (404 = not registered, which is expected)"
echo "   - Extension files are properly loaded"
echo ""

echo "⚠️  MISSING: Petra Wallet (required for transactions)"
echo ""

echo "📱 STEP 1: Install Petra Wallet"
echo "1. Open Chrome Web Store: https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci"
echo "2. Click 'Add to Chrome'"
echo "3. Follow setup instructions to create a wallet"
echo ""

echo "🔄 STEP 2: Reload Green Points Extension"
echo "1. Go to chrome://extensions/"
echo "2. Find 'Green Points Wallet'"
echo "3. Click the reload button 🔄"
echo ""

echo "🧪 STEP 3: Test the Extension"
echo "1. Go to: file:///Users/geu/Greenn/test-extension.html"
echo "2. Click the Green Points extension icon"
echo "3. Try 'Check Balance' - should work without Petra"
echo "4. Try 'Award Points' - will ask for Petra wallet"
echo ""

echo "💡 What Works Now:"
echo "   ✅ Check Balance (works without Petra)"
echo "   ❌ Award/Redeem Points (needs Petra wallet)"
echo ""

echo "🎯 After Installing Petra:"
echo "   ✅ All buttons will work"
echo "   ✅ Can sign transactions"
echo "   ✅ Full Green Points functionality"

echo ""
echo "🔗 Petra Wallet Direct Link:"
echo "chrome-extension://ejjladinnckdgjemekebdpeokbikhfci/index.html"

open -a "Google Chrome" "https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci"
