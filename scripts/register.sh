#!/bin/bash
set -e

ADMIN_ADDR=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3}

echo "📝 Registering student for Green Points..."
# This transaction must be signed by the student.
# We use the 'student' profile we created in the config.yaml.
aptos move run \
  --function-id "${ADMIN_ADDR}::green_points::register" \
  --profile student \
  --assume-yes
  
echo "✅ Student registration transaction submitted."
echo "   Check the explorer for confirmation."
