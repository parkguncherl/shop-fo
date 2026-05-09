#!/bin/bash
BASE_FILE="./generated/base.ts"
OLD='export const BASE_PATH = "http://172.26.5.177:8080/shop-ap".replace(/\/+$/, "");'
NEW='export const BASE_PATH = (process.env.NEXT_PUBLIC_SMART_API_ENDPOINT || "http://172.26.5.177:8080/shop-ap").replace(/\/+$/, "");'
sed -i "s|$OLD|$NEW|g" "$BASE_FILE"
echo "✅ base.ts 패치 완료"
EOF