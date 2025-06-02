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
    if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
      return 0;
    }
    
    // 確保ethAmount是數字
    const amount = parseFloat(ethAmount);
    const result = await getEthToUsdRate();
    const usdValue = amount * result.price;
    
    console.log(`${amount} ETH = ${usdValue} USD (匯率: ${result.price})`);
    return usdValue;
  } catch (error) {
    console.error('ETH到USD轉換錯誤:', error);
    // 返回估計值而不是null，避免顯示N/A
    const defaultRate = 3000;
    const estimatedUsd = parseFloat(ethAmount) * defaultRate;
    console.log(`使用預設匯率: ${parseFloat(ethAmount)} ETH = ${estimatedUsd} USD (預設匯率: ${defaultRate})`);
    return estimatedUsd;
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