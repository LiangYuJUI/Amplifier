# 區塊鏈透明慈善捐贈平台

這是一個基於區塊鏈技術的高透明度慈善捐贈平台，使用以太坊智能合約實現捐款、提款和資金使用透明度。

## 功能

- 創建慈善項目
- 向項目捐款
- 資金提取（僅限受益人）
- 記錄支出（僅限受益人）
- 透明的資金流向追蹤
- MetaMask錢包整合

## 技術堆疊

- 智能合約：Solidity
- 區塊鏈框架：Truffle
- 本地區塊鏈：Ganache
- 前端框架：React
- Web3整合：Web3.js
- 錢包連接：MetaMask

## 開始使用

### 先決條件

- Node.js v14+
- MetaMask瀏覽器擴展
- Ganache (本地區塊鏈)

### 安裝步驟

1. 克隆倉庫
```
git clone <repository-url>
cd Amplifier
```

2. 安裝依賴
```
cd client
npm install
cd ..
npm install -g truffle
```

### 啟動應用

我們提供了幾個腳本來簡化開發流程：

1. 啟動本地區塊鏈
```
./start-ganache.sh
```

2. 部署智能合約
```
./deploy-contract.sh
```

3. 啟動前端應用
```
./start-frontend.sh
```

4. 或者，一鍵啟動所有服務
```
./start-all.sh
```

## MetaMask 設置

要使用此應用，您需要在MetaMask中設置Ganache本地網絡：

1. 打開MetaMask
2. 點擊頂部的網絡選擇器
3. 點擊"添加網絡"
4. 填寫以下信息:
   - 網絡名稱: Ganache Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - 貨幣符號: ETH
   - 區塊瀏覽器URL: (可留空)
5. 保存並選擇該網絡

### 重要說明

- 重啟Ganache後，您通常不需要重新設置網絡，只需在MetaMask中重新選擇"Ganache Local"網絡即可。
- 我們使用固定的助記詞，因此每次重啟Ganache時，您都可以使用相同的賬戶。
- 如果您在連接MetaMask時遇到問題，請確保：
  1. Ganache正在運行
  2. 您已在MetaMask中選擇了"Ganache Local"網絡
  3. 您的MetaMask已解鎖

## MetaMask 連接問題解決方案

### Circuit Breaker 錯誤

如果您遇到 MetaMask "circuit breaker" 錯誤，這是 MetaMask 的安全機制被觸發的結果。以下是解決方法：

1. **重新啟動瀏覽器**：完全關閉瀏覽器（包括所有標籤和窗口）後重新打開。

2. **重置 MetaMask 活動**：
   - 打開 MetaMask 擴展
   - 點擊右上角的圓形圖標
   - 選擇 "設置"
   - 選擇 "高級"
   - 點擊 "重置賬戶" (這不會刪除您的賬戶，只會清除交易歷史)

3. **清除瀏覽器緩存**：
   - 在瀏覽器設置中找到 "清除瀏覽數據" 選項
   - 選擇 "Cookie 及其他網站數據" 和 "緩存的圖像和文件"
   - 點擊 "清除數據"

4. **更新 MetaMask**：確保您使用的是最新版本的 MetaMask 擴展。

5. **使用延遲連接**：我們已在應用程序中實現了延遲連接機制，這應該能夠解決大多數 circuit breaker 錯誤。

6. **檢查網絡設置**：
   - 確保您的 MetaMask 已添加並選擇了正確的網絡（本地 Ganache 網絡）
   - 網絡名稱：Ganache Local
   - RPC URL：http://127.0.0.1:8545
   - Chain ID：1337
   - 貨幣符號：ETH

### 其他常見問題

1. **連接按鈕不起作用**：
   - 確保 Ganache 正在運行（執行 `./start-ganache.sh`）
   - 檢查瀏覽器控制台是否有錯誤信息
   - 嘗試重新載入頁面

2. **交易失敗**：
   - 確保您的 MetaMask 賬戶中有足夠的 ETH 支付 gas 費
   - 檢查合約是否已正確部署（執行 `./deploy-contract.sh`）
   - 確認您使用的是正確的網絡

3. **合約交互問題**：
   - 重新部署合約（執行 `./deploy-contract.sh`）
   - 確保前端使用的合約 ABI 和地址是最新的

4. **如果所有方法都失敗**：
   - 完全重置環境：關閉所有服務，刪除 `ganache-db` 目錄
   - 重新啟動 Ganache：`./start-ganache.sh`
   - 重新部署合約：`./deploy-contract.sh`
   - 重新啟動前端：`./start-frontend.sh`

## 開發

### 智能合約

主要的智能合約是 `CharityDonation.sol`，它實現了以下功能：

- 創建慈善項目
- 接收捐款
- 提取資金
- 記錄支出
- 查詢項目、捐款和支出記錄

### 前端

前端使用React構建，主要組件包括：

- Header：顯示應用標題和用戶賬戶信息
- ProjectList：顯示所有慈善項目列表
- ProjectForm：創建新的慈善項目
- ProjectDetails：顯示項目詳情、捐款和支出記錄
- DonationForm：向項目捐款

## 許可證

[MIT](LICENSE) 