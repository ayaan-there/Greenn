#!/bin/bash
set -e

echo "🔧 Green Points Extension Troubleshooting"
echo "=========================================="

echo "📁 Checking extension files..."
EXTENSION_DIR="/Users/geu/Greenn/extension"

if [ -d "$EXTENSION_DIR" ]; then
    echo "✅ Extension directory exists: $EXTENSION_DIR"
    echo "📋 Files in extension directory:"
    ls -la "$EXTENSION_DIR"
else
    echo "❌ Extension directory not found!"
    exit 1
fi

echo ""
echo "🔍 Checking file permissions..."
for file in "$EXTENSION_DIR"/*.js "$EXTENSION_DIR"/*.json "$EXTENSION_DIR"/*.html; do
    if [ -f "$file" ]; then
        echo "✅ $(basename "$file"): $(ls -l "$file" | cut -d' ' -f1)"
    fi
done

echo ""
echo "📝 Extension Manifest:"
cat "$EXTENSION_DIR/manifest.json"

echo ""
echo "🌐 Test Instructions:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' and select: $EXTENSION_DIR"
echo "4. Open the test page: file:///Users/geu/Greenn/test-extension.html"
echo "5. Click the extension icon and try the buttons"
echo "6. Check console logs in both the popup and the test page"

echo ""
echo "🐛 Debug Tips:"
echo "- Right-click extension icon → 'Inspect popup' to see popup console"
echo "- F12 on test page to see page console"
echo "- Look for 'Green Points:' prefixed log messages"
echo "- Make sure Petra wallet extension is installed"

echo ""
echo "✅ Troubleshooting script complete!"
