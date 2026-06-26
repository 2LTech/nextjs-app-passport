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

# Typecheck published types (consumer fixture against ./index.d.ts)
echo "[+] Typecheck published types..."
yarn typecheck:types
echo "    ok"

# Pack manifest (ensure the published tarball actually ships ./index.d.ts)
echo "[+] Pack manifest..."
yarn check:pack
echo "    ok"

# Build
echo "[+] Build..."
yarn build
echo "    ok"

echo " -> All done!"
