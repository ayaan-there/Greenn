#!/bin/bash
set -e

echo "📦 Publishing Move package..."
aptos move publish \
  --named-addresses Greenn=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3} \
  --assume-yes
echo "✅ Package published successfully"
