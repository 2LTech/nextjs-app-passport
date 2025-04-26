#!/bin/sh

set -e

# Install
echo "[+] Install..."
yarn >/dev/null 2>&1
echo "    ok"

# Depcheck
echo "[+] Depcheck..."
yarn depcheck >/dev/null 2>&1
echo "    ok"

# Prettier
echo "[+] Prettier..."
yarn prettier >/dev/null 2>&1
echo "    ok"

# Doc
echo "[+] Doc..."
yarn doc >/dev/null 2>&1
echo "    ok"

# Test
echo "[+] Test..."
yarn test >/dev/null 2>&1
echo "    ok"

# Build
echo "[+] Build..."
yarn build >/dev/null 2>&1
echo "    ok"

echo " -> All done!"
