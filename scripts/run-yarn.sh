#!/bin/bash

# Helper script to run yarn commands in backend without pnpm interference

cd /home/w3bsuki/indecisive-wear-store-main
mv package.json package.json.temp 2>/dev/null || true

cd backend
yarn "$@"
result=$?

cd ..
mv package.json.temp package.json 2>/dev/null || true

exit $result