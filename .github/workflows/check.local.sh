#!/bin/sh

set -e

activateBrowse="$1"

# Install
echo "[+] Install..."
yarn
echo "    ok"

# Depcheck
echo "[+] Depcheck..."
yarn depcheck
echo "    ok"

# Prettier
echo "[+] Prettier..."
yarn prettier
echo "    ok"

# Doc
echo "[+] Doc..."
yarn doc
if [ -n "$activateBrowse" ]; then
  browse ./docs/index.html
fi
echo "    ok"

# Test
echo "[+] Test..."
yarn test
if [ -n "$activateBrowse" ]; then
  browse ./coverage/lcov-report/index.html
fi
echo "    ok"

# Type test (declaration-level coverage of the published index.d.ts)
echo "[+] Type test..."
yarn test:types
echo "    ok"

# Build
echo "[+] Build..."
yarn build
echo "    ok"

echo " -> All done!"
