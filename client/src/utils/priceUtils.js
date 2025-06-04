/**
 * 加密貨幣價格工具函數
 */

// 緩存ETH價格數據
let ethPriceCache = {
  price: 3000,  // 初始預設價格
  timestamp: 0
};

// 模擬ETH價格波動（作為備用方案）
const simulateEthPrice = () => {
  // 在基礎價格的基礎上添加一個小的隨機波動（-5% 到 +5%）
  const basePrice = 3000;
  const fluctuation = basePrice * 0.05; // 5%的波動
  const randomChange = Math.random() * fluctuation * 2 - fluctuation; // -fluctuation 到 +fluctuation
  return basePrice + randomChange;
};

// 獲取ETH到USD的即時匯率
export const getEthToUsdRate = async (forceRefresh = false) => {
  try {
    // 檢查緩存是否有效（5分鐘內）並且不是強制刷新
    const now = Date.now();
    if (!forceRefresh && ethPriceCache.price && (now - ethPriceCache.timestamp < 5 * 60 * 1000)) {
      console.log("使用緩存的ETH價格:", ethPriceCache.price);
      return {
        price: ethPriceCache.price,
        isSimulated: ethPriceCache.isSimulated
      };
    }
    
    console.log(forceRefresh ? "強制刷新ETH價格..." : "獲取ETH價格...");
    
    // 嘗試使用 CryptoCompare API
    try {
      const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.USD) {
          const price = data.USD;
          console.log("CryptoCompare API 獲取到的ETH價格:", price);
          
          // 更新緩存
          ethPriceCache = {
            price: price,
            timestamp: now,
            isSimulated: false
          };
          return {
            price: price,
            isSimulated: false
          };
        } else {
          console.warn("API 返回數據格式不正確:", data);
        }
      } else {
        console.warn("API 請求失敗:", response.status);
      }
    } catch (apiError) {
      console.error("API 錯誤:", apiError);
    }
    
    // 如果 CryptoCompare API 失敗，嘗試使用 CoinGecko API
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.ethereum && data.ethereum.usd) {
          const price = data.ethereum.usd;
          console.log("CoinGecko API 獲取到的ETH價格:", price);
          
          // 更新緩存
          ethPriceCache = {
            price: price,
            timestamp: now,
            isSimulated: false
          };
          return {
            price: price,
            isSimulated: false
          };
        } else {
          console.warn("API 返回數據格式不正確:", data);
        }
      } else {
        console.warn("API 請求失敗:", response.status);
      }
    } catch (apiError) {
      console.error("API 錯誤:", apiError);
    }
    
    // 如果API請求失敗，使用模擬價格
    console.log("API請求失敗，使用模擬價格");
    const price = simulateEthPrice();
    console.log("模擬ETH價格:", price);
    
    // 更新緩存
    ethPriceCache = {
      price: price,
      timestamp: now,
      isSimulated: true
    };
    
    return {
      price: price,
      isSimulated: true
    };
  } catch (error) {
    console.error('獲取ETH價格錯誤:', error);
    
    // 如果緩存中有數據，使用緩存數據
    if (ethPriceCache.price) {
      console.log("發生錯誤，使用緩存價格:", ethPriceCache.price);
      return {
        price: ethPriceCache.price,
        isSimulated: ethPriceCache.isSimulated || true
      };
    }
    
    // 如果完全無法獲取價格，返回一個預設值
    console.log("無法獲取價格，使用預設值");
    return {
      price: 3000, // 預設ETH價格
      isSimulated: true
    };
  }
};

// ETH轉換為USD
export const ethToUsd = async (ethAmount) => {
  try {
    // 檢查輸入是否有效
    if (ethAmount === null || ethAmount === undefined) {
      console.warn('ETH金額為null或undefined，返回0');
      return 0;
    }
    
    // 確保ethAmount是字符串並嘗試轉換為數字
    const ethAmountStr = ethAmount.toString();
    const amount = parseFloat(ethAmountStr);
    
    // 檢查轉換後的數字是否有效
    if (isNaN(amount) || amount <= 0) {
      console.warn(`無效的ETH金額: ${ethAmountStr}，返回0`);
      return 0;
    }
    
    console.log(`嘗試轉換 ${amount} ETH 為 USD...`);
    
    // 獲取匯率
    const result = await getEthToUsdRate();
    
    // 檢查匯率是否有效
    if (!result || !result.price || isNaN(result.price)) {
      console.warn('獲取到無效的匯率，使用預設匯率');
      const defaultRate = 3000;
      const estimatedUsd = amount * defaultRate;
      console.log(`使用預設匯率: ${amount} ETH = ${estimatedUsd} USD (預設匯率: ${defaultRate})`);
      return estimatedUsd;
    }
    
    // 計算USD價值
    const usdValue = amount * result.price;
    
    console.log(`${amount} ETH = ${usdValue} USD (匯率: ${result.price}${result.isSimulated ? ', 模擬' : ''})`);
    return usdValue;
  } catch (error) {
    console.error('ETH到USD轉換錯誤:', error);
    
    // 嘗試從錯誤中恢復
    try {
      // 確保我們有一個有效的數字
      const safeAmount = parseFloat(ethAmount) || 0;
      if (safeAmount <= 0) return 0;
      
      // 使用預設匯率
      const defaultRate = 3000;
      const estimatedUsd = safeAmount * defaultRate;
      console.log(`錯誤恢復: ${safeAmount} ETH = ${estimatedUsd} USD (預設匯率: ${defaultRate})`);
      return estimatedUsd;
    } catch (recoveryError) {
      console.error('無法從ETH到USD轉換錯誤中恢復:', recoveryError);
      return 0; // 最後的後備值
    }
  }
};

// 格式化USD金額
export const formatUsd = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// 格式化ETH金額
export const formatEth = (amount) => {
  if (amount === null || amount === undefined) return '0';
  
  // 將wei轉換為ETH並格式化
  try {
    const ethValue = parseFloat(amount);
    return ethValue.toFixed(4);
  } catch (error) {
    console.error('ETH格式化錯誤:', error);
    return '0';
  }
}; 