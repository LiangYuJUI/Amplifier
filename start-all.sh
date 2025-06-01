#!/bin/bash

# 固定助記詞
MNEMONIC="cupboard prefer kidney wait injury garbage raccoon mistake bonus word vast arena"

# 啟動ganache（背景執行，port 8545）
echo "[1/3] 啟動 Ganache..."
npx ganache --port 8545 --mnemonic "$MNEMONIC" --chain.chainId 1337 > ganache.log 2>&1 &
GANACHE_PID=$!
sleep 3

# 部署合約
echo "[2/3] 部署智能合約..."
npx truffle migrate --reset

# 複製ABI到前端
cp build/contracts/CharityDonation.json client/src/contracts/

# 啟動前端
cd client
echo "[3/3] 啟動 React 前端..."
npm start

# 關閉ganache（當前端結束時）
echo "正在關閉 Ganache..."
kill $GANACHE_PID 