#!/bin/bash
set -e

echo "🚀 Green Points Demo - Local Testing"
echo "======================================"

# Set demo environment variables
export ADMIN=0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3
export STUDENT=0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b

echo "📍 Using addresses:"
echo "   Admin:   $ADMIN"
echo "   Student: $STUDENT"
echo ""

echo "🔨 Step 1: Compiling Move package..."
./scripts/compile.sh
echo ""

echo "🧪 Step 2: Running unit tests..."
aptos move test --named-addresses Greenn=$ADMIN
echo ""

echo "📋 Step 3: Package information..."
echo "   Module: Greenn::green_points"
echo "   Coin Type: ${ADMIN}::green_points::GreenPoints"
echo "   Events: AwardedEvent, RedeemedEvent"
echo ""

echo "🌐 Step 4: Chrome Extension Setup"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked' and select: $(pwd)/extension/"
echo "   4. Install Petra wallet if not already installed"
echo ""

echo "📱 Step 5: Extension Features"
echo "   • Check Green Points balance"
echo "   • Award points (admin only)"
echo "   • Redeem points (merchants/admin only)"
echo "   • All transactions go through Petra wallet"
echo ""

echo "💡 Step 6: For Mainnet Deployment"
echo "   Run: ./scripts/publish.sh (requires funded admin account)"
echo "   Then: ./scripts/init.sh (initialize the coin)"
echo ""

echo "✅ Demo ready! Load the extension and start testing."
echo "   Extension folder: $(pwd)/extension/"
