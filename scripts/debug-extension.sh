#!/bin/bash
set -e

echo "🔍 Green Points Extension Debug Test"
echo "===================================="

echo "1. Opening Chrome Extensions page..."
open -a "Google Chrome" "chrome://extensions/"

echo ""
echo "2. Extension files check:"
ls -la /Users/geu/Greenn/extension/

echo ""
echo "3. Testing if extension folder is valid:"
if [ -f "/Users/geu/Greenn/extension/manifest.json" ]; then
    echo "✅ manifest.json found"
else
    echo "❌ manifest.json missing"
    exit 1
fi

if [ -f "/Users/geu/Greenn/extension/popup.html" ]; then
    echo "✅ popup.html found"
else
    echo "❌ popup.html missing"
    exit 1
fi

if [ -f "/Users/geu/Greenn/extension/popup.js" ]; then
    echo "✅ popup.js found"
else
    echo "❌ popup.js missing"
    exit 1
fi

if [ -f "/Users/geu/Greenn/extension/content.js" ]; then
    echo "✅ content.js found"
else
    echo "❌ content.js missing"
    exit 1
fi

if [ -f "/Users/geu/Greenn/extension/aptos-client.js" ]; then
    echo "✅ aptos-client.js found"
else
    echo "❌ aptos-client.js missing"
    exit 1
fi

echo ""
echo "4. Opening test page..."
open -a "Google Chrome" "file:///Users/geu/Greenn/test-extension.html"

echo ""
echo "📋 INSTRUCTIONS:"
echo "1. In Chrome Extensions page:"
echo "   - Enable 'Developer mode' (top right toggle)"
echo "   - Click 'Load unpacked'"
echo "   - Select folder: /Users/geu/Greenn/extension/"
echo ""
echo "2. Test the extension:"
echo "   - Click the Green Points extension icon"
echo "   - Right-click the icon → 'Inspect popup' to see console"
echo "   - Try clicking 'Check Balance' button"
echo ""
echo "3. Debug steps:"
echo "   - Check popup console for 'Green Points Popup:' messages"
echo "   - Check test page console for 'Green Points:' messages"
echo "   - Verify content script is loading"

echo ""
echo "✅ Debug script complete!"
