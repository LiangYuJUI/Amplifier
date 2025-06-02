# 區塊鏈透明慈善捐贈平台 (Amplifier)

這是一個基於區塊鏈技術的高透明度慈善捐贈平台，使用以太坊智能合約實現捐款、提款和資金使用透明度。平台支持ETH到USD的實時匯率轉換，讓使用者更容易理解捐贈金額的實際價值。

## 功能

- 創建慈善項目
- 向項目捐款
- 資金提取（僅限受益人）
- 記錄支出（僅限受益人）
- 透明的資金流向追蹤
- ETH/USD 實時匯率顯示（每10秒自動更新）
- MetaMask錢包整合

## 技術堆疊

- 智能合約：Solidity
- 區塊鏈框架：Truffle
- 本地區塊鏈：Ganache
- 前端框架：React
- Web3整合：Web3.js
- 錢包連接：MetaMask
- 價格API：CryptoCompare、CoinGecko

## 開始使用

### 先決條件

- Node.js v14+（推薦 v16 或更高版本）
- MetaMask瀏覽器擴展（最新版本）
- Ganache（本地區塊鏈模擬器）

### 詳細安裝步驟

1. 克隆倉庫
```bash
git clone <repository-url>
cd Amplifier
```

2. 安裝全局依賴
```bash
npm install -g truffle
npm install -g ganache-cli  # 如果您沒有安裝Ganache GUI版本
```

3. 安裝項目依賴
```bash
# 安裝主項目依賴
npm install

# 安裝前端依賴
cd client
npm install
cd ..
```

4. 確保腳本有執行權限
```bash
chmod +x start-ganache.sh
chmod +x deploy-contract.sh
chmod +x start-frontend.sh
chmod +x start-all.sh
```

### 啟動應用（詳細步驟）

我們提供了幾個腳本來簡化開發流程。請按照以下順序執行：

1. 啟動本地區塊鏈（在一個獨立的終端窗口中）
```bash
./start-ganache.sh
```
確認輸出中顯示了10個賬戶地址和私鑰，以及監聽在8545端口的信息。

2. 部署智能合約
```bash
./deploy-contract.sh
```
確認輸出顯示合約部署成功，並記下合約地址。

3. 啟動前端應用
```bash
./start-frontend.sh
```
這將啟動React開發服務器，默認在 http://localhost:3000 運行。

4. 或者，一鍵啟動所有服務（不推薦首次使用時使用）
```bash
./start-all.sh
```

### 訪問應用

打開瀏覽器訪問 http://localhost:3000 即可使用應用。

## MetaMask 詳細設置

要使用此應用，您需要在MetaMask中設置Ganache本地網絡：

1. 安裝MetaMask瀏覽器擴展（如果尚未安裝）
2. 打開MetaMask並創建或導入錢包
3. 點擊頂部的網絡選擇器（默認顯示"Ethereum Mainnet"）
4. 點擊"添加網絡" > "添加網絡手動"
5. 填寫以下信息:
   - 網絡名稱: Ganache Local
   - 新增RPC URL: http://127.0.0.1:8545
   - 鏈ID: 1337
   - 貨幣符號: ETH
   - 區塊瀏覽器URL: (可留空)
6. 點擊"保存"並選擇該網絡

### 導入Ganache賬戶到MetaMask

為了測試不同角色（管理員、受益人等），您可能需要導入Ganache提供的測試賬戶：

1. 在Ganache界面或終端輸出中複製任一私鑰
2. 在MetaMask中，點擊右上角的圓形圖標
3. 選擇"導入賬戶"
4. 粘貼私鑰並點擊"導入"

現在您可以使用這個導入的賬戶與應用交互。

### 重要說明

- 每次重啟Ganache後，您需要確保在MetaMask中選擇了"Ganache Local"網絡。
- 我們使用固定的助記詞，因此每次重啟Ganache時，您都可以使用相同的賬戶。
- 如果您在連接MetaMask時遇到問題，請確保：
  1. Ganache正在運行（檢查終端輸出或Ganache GUI）
  2. 您已在MetaMask中選擇了"Ganache Local"網絡
  3. 您的MetaMask已解鎖
  4. 瀏覽器允許來自CryptoCompare和CoinGecko的API請求（用於ETH/USD匯率）

## ETH/USD 匯率功能

本應用集成了ETH到USD的實時匯率轉換功能：

- 匯率每10秒自動更新一次
- 使用CryptoCompare和CoinGecko API獲取實時價格
- 如果API請求失敗，會顯示模擬數據
- 在項目列表和詳情頁面顯示ETH和等值的USD金額

### 匯率API說明

應用會嘗試從以下來源獲取ETH/USD匯率：
1. 首先嘗試CryptoCompare API
2. 如果失敗，嘗試CoinGecko API
3. 如果兩者都失敗，使用模擬數據（基於3000 USD/ETH的基準價格，添加小幅隨機波動）

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

5. **檢查網絡設置**：
   - 確保您的 MetaMask 已添加並選擇了正確的網絡（本地 Ganache 網絡）
   - 網絡名稱：Ganache Local
   - RPC URL：http://127.0.0.1:8545
   - Chain ID：1337
   - 貨幣符號：ETH

### 內容安全策略 (CSP) 問題

如果您在控制台中看到與內容安全策略相關的錯誤，可能是因為瀏覽器阻止了對CryptoCompare或CoinGecko API的請求。解決方法：

1. 確保您使用的是最新版本的應用代碼，我們已經在`index.html`中添加了適當的CSP設置。
2. 如果仍然有問題，可能需要暫時禁用瀏覽器的某些安全設置或使用Chrome的`--disable-web-security`選項（僅用於測試）。

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

4. **ETH/USD匯率不顯示或顯示為模擬數據**：
   - 檢查瀏覽器控制台是否有API請求錯誤
   - 確認您的網絡連接正常
   - 確認瀏覽器允許跨域請求到CryptoCompare和CoinGecko

5. **如果所有方法都失敗**：
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
- ExchangeRateDisplay：顯示ETH/USD實時匯率（每10秒自動更新）

## 許可證

[MIT](LICENSE) 