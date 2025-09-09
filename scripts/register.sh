#!/bin/bash
set -e

ADMIN_ADDR=${ADMIN:-0x81016bf623696dee3897ac2e423813a6657b3b7ca004c0c16bac663291da2ec3}
STUDENT_ADDR=${STUDENT:-0x7ac9d4dd56d3e00eec939edbb2ad1a6b33925ddc7461e7dd298711613dede91b}

echo "📝 Registering student for Green Points..."
aptos move run \
  --function-id ${ADMIN_ADDR}::green_points::register \
  --profile ${STUDENT_ADDR} \
  --assume-yes
echo "✅ Student registered successfully"
