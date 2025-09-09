#!/bin/bash
set -e

ADMIN_ADDR=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3}

echo "🚀 Initializing Green Points coin..."
aptos move run \
  --function-id ${ADMIN_ADDR}::green_points::init \
  --args string:"Green Points" string:"GPNT" u8:8 \
  --assume-yes
echo "✅ Green Points initialized successfully"
