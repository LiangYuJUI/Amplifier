import React, { useState, useEffect } from 'react';
import { getEthToUsdRate } from '../utils/priceUtils';

function ExchangeRateDisplay() {
  const [rate, setRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextUpdateIn, setNextUpdateIn] = useState(10);
  const [refreshing, setRefreshing] = useState(false);
  
  // 獲取匯率
  const fetchRate = async (showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      setError(false);
      
      // 獲取ETH/USD匯率
      const result = await getEthToUsdRate(forceRefresh);
      
      if (result && result.price) {
        setRate(result.price);
        setLastUpdated(new Date());
        setError(false);
        // 設置是否為模擬數據
        setIsSimulated(result.isSimulated);
        // 重置倒計時
        setNextUpdateIn(10);
      } else {
        setError(true);
        setIsSimulated(true);
      }
    } catch (error) {
      console.error("獲取匯率錯誤:", error);
      setError(true);
      setIsSimulated(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 手動刷新匯率
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchRate(false, true);
  };
  
  // 初始加載和定時刷新
  useEffect(() => {
    fetchRate();
    
    // 每10秒刷新一次匯率
    const interval = setInterval(() => fetchRate(false, true), 10 * 1000);
    
    // 添加倒計時更新
    const countdownInterval = setInterval(() => {
      setNextUpdateIn(prev => {
        if (prev <= 1) return 10;
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);
  
  // 格式化最後更新時間
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return '剛剛更新';
    } else if (diffMins === 1) {
      return '1 分鐘前';
    } else if (diffMins < 60) {
      return `${diffMins} 分鐘前`;
    } else {
      return lastUpdated.toLocaleTimeString();
    }
  };
  
  if (loading && !rate) {
    return (
      <div className="exchange-rate">
        <div className="loading-spinner"></div>
        <span>獲取ETH匯率中...</span>
      </div>
    );
  }
  
  return (
    <div className={`exchange-rate ${error ? 'exchange-rate-error' : ''}`}>
      <div className="rate-icon">
        <i className="fab fa-ethereum"></i>
      </div>
      <div className="rate-info">
        <div className="rate-value">
          1 ETH = ${rate ? rate.toFixed(2) : '---'} USD
          {isSimulated && <span className="simulation-badge">模擬數據</span>}
        </div>
        <div className="rate-updated">
          <span>
            {error ? '無法獲取即時匯率' : formatLastUpdated()}
            <span className="next-update"> ({nextUpdateIn}秒後更新)</span>
          </span>
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            title="立即刷新匯率"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExchangeRateDisplay; 