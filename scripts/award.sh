#!/bin/bash
set -e

ADMIN_ADDR=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3}
STUDENT_ADDR=${STUDENT:-0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b}
AMOUNT=${1:-100}

echo "💰 Awarding ${AMOUNT} Green Points to student..."
# This transaction must be signed by the admin.
# We use the 'default' profile.
aptos move run \
  --function-id "${ADMIN_ADDR}::green_points::award" \
  --args "address:${STUDENT_ADDR}" "u64:${AMOUNT}" \
  --profile default \
  --assume-yes

echo "✅ Awarded ${AMOUNT} Green Points successfully"
