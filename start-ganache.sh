#!/bin/bash

# 固定助記詞和網絡設置
MNEMONIC="cupboard prefer kidney wait injury garbage raccoon mistake bonus word vast arena"
CHAIN_ID=1337
NETWORK_ID=1337
PORT=8545

# 啟動ganache
echo "啟動 Ganache 本地區塊鏈..."
echo "使用固定助記詞: $MNEMONIC"
echo "Chain ID: $CHAIN_ID"
echo "Network ID: $NETWORK_ID"
echo "RPC URL: http://127.0.0.1:$PORT"
echo ""
echo "MetaMask 連接設置:"
echo "- 網絡名稱: Ganache Local"
echo "- RPC URL: http://127.0.0.1:$PORT"
echo "- Chain ID: $CHAIN_ID"
echo "- 貨幣符號: ETH"
echo ""
echo "按 Ctrl+C 可停止 Ganache 服務"
echo "=============================================="

# 啟動Ganache (前台執行，方便查看日誌)
npx ganache --port $PORT --mnemonic "$MNEMONIC" --chain.chainId $CHAIN_ID --network-id $NETWORK_ID --db.directory ./ganache-db 