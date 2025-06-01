#!/bin/bash

# 檢查Ganache是否運行
if ! lsof -i:8545 -t &>/dev/null; then
  echo "錯誤: Ganache 未啟動，請先執行 ./start-ganache.sh"
  exit 1
fi

# 部署合約
echo "部署智能合約到本地區塊鏈..."
npx truffle migrate --reset

# 複製合約ABI到前端目錄
echo "將合約ABI複製到前端目錄..."
cp -f build/contracts/CharityDonation.json client/src/contracts/

echo "=============================================="
echo "合約部署完成！"
echo "合約ABI已複製到 client/src/contracts/CharityDonation.json"
echo "==============================================" 