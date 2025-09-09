#!/bin/bash
set -e

ADMIN_ADDR=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3}
STUDENT_ADDR=${STUDENT:-0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b}
CAFE_ADDR=${CAFE:-$ADMIN_ADDR}
AMOUNT=${1:-50}

echo "🔥 Redeeming ${AMOUNT} Green Points from student..."
# This transaction must be signed by the cafe/merchant (or admin).
# We use the 'default' profile, assuming the admin is the merchant.
aptos move run \
  --function-id "${ADMIN_ADDR}::green_points::redeem_from" \
  --args "address:${ADMIN_ADDR}" "address:${STUDENT_ADDR}" "u64:${AMOUNT}" \
  --profile default \
  --assume-yes

echo "✅ Redeemed ${AMOUNT} Green Points successfully"
