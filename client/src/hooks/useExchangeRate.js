import { useState, useEffect, useCallback } from 'react';

const CACHE_DURATION = 10000; // 10 seconds
const FALLBACK_RATE = 3000; // Fallback ETH price in USD

export const useExchangeRate = () => {
  const [ethPrice, setEthPrice] = useState(FALLBACK_RATE);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [source, setSource] = useState('fallback');

  const fetchFromCryptoCompare = useCallback(async () => {
    const response = await fetch(
      'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD',
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) throw new Error('CryptoCompare API failed');
    
    const data = await response.json();
    if (data.USD) {
      return { price: data.USD, source: 'CryptoCompare' };
    }
    throw new Error('Invalid CryptoCompare response');
  }, []);

  const fetchFromCoinGecko = useCallback(async () => {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { method: 'GET', headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) throw new Error('CoinGecko API failed');
    
    const data = await response.json();
    if (data.ethereum && data.ethereum.usd) {
      return { price: data.ethereum.usd, source: 'CoinGecko' };
    }
    throw new Error('Invalid CoinGecko response');
  }, []);

  const generateMockPrice = useCallback(() => {
    // Generate a price within ±5% of the fallback rate
    const variation = (Math.random() - 0.5) * 0.1; // ±5%
    const mockPrice = FALLBACK_RATE * (1 + variation);
    return { price: Math.round(mockPrice), source: 'Mock Data' };
  }, []);

  const fetchPrice = useCallback(async () => {
    // Check cache first
    if (lastUpdated && Date.now() - lastUpdated < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Try CryptoCompare first
      const result = await fetchFromCryptoCompare();
      setEthPrice(result.price);
      setSource(result.source);
    } catch (cryptoCompareError) {
      console.warn('CryptoCompare failed, trying CoinGecko:', cryptoCompareError.message);
      
      try {
        // Try CoinGecko as fallback
        const result = await fetchFromCoinGecko();
        setEthPrice(result.price);
        setSource(result.source);
      } catch (coinGeckoError) {
        console.warn('CoinGecko failed, using mock data:', coinGeckoError.message);
        
        // Use mock data as final fallback
        const result = generateMockPrice();
        setEthPrice(result.price);
        setSource(result.source);
        setError('Using simulated data - API services unavailable');
      }
    }

    setLastUpdated(Date.now());
    setLoading(false);
  }, [lastUpdated, fetchFromCryptoCompare, fetchFromCoinGecko, generateMockPrice]);

  // Auto-refresh effect
  useEffect(() => {
    fetchPrice(); // Initial fetch
    
    const interval = setInterval(fetchPrice, CACHE_DURATION);
    
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const convertEthToUsd = useCallback((ethAmount) => {
    if (!ethAmount || ethAmount === '0') return '0.00';
    const usdAmount = parseFloat(ethAmount) * ethPrice;
    return usdAmount.toFixed(2);
  }, [ethPrice]);

  const convertUsdToEth = useCallback((usdAmount) => {
    if (!usdAmount || usdAmount === '0') return '0.0000';
    const ethAmount = parseFloat(usdAmount) / ethPrice;
    return ethAmount.toFixed(6);
  }, [ethPrice]);

  return {
    ethPrice,
    lastUpdated,
    loading,
    error,
    source,
    convertEthToUsd,
    convertUsdToEth,
    refresh: fetchPrice
  };
};

