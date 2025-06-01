#!/bin/bash

# 確認Ganache是否運行
if ! lsof -i:8545 -t &> /dev/null; then
    echo "警告: Ganache 未啟動，請先執行 ./start-ganache.sh"
    echo "繼續啟動前端，但可能無法連接到區塊鏈..."
fi

# 確認合約ABI是否存在
if [ ! -f "client/src/contracts/CharityDonation.json" ]; then
    echo "警告: 合約ABI文件不存在，請先執行 ./deploy-contract.sh"
    echo "繼續啟動前端，但可能無法連接到合約..."
fi

# 啟動前端
echo "啟動React前端..."
cd client
npm start 