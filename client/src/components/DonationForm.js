import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ethToUsd, formatUsd, formatEth } from '../utils/priceUtils';

function DonationForm({ project, onDonate, onCancel }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [maxAmount, setMaxAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usdAmount, setUsdAmount] = useState(null);
  const [usdValues, setUsdValues] = useState({
    goal: null,
    raised: null
  });
  const [loadingUsd, setLoadingUsd] = useState(false);
  
  // 使用Web3.utils而不是依賴window.web3
  const fromWei = (value) => {
    return Web3.utils.fromWei(value.toString(), 'ether');
  };
  
  // 初始化時獲取用戶錢包餘額和USD匯率
  useEffect(() => {
    const init = async () => {
      try {
        // 檢查錢包餘額
        if (window.ethereum && window.ethereum.selectedAddress) {
          const web3Instance = new Web3(window.ethereum);
          const balance = await web3Instance.eth.getBalance(window.ethereum.selectedAddress);
          // 設置最大捐款金額為用戶餘額的95%（留出gas費）
          const maxDonation = parseFloat(fromWei(balance)) * 0.95;
          setMaxAmount(maxDonation.toFixed(4));
        }
        
        // 獲取項目的USD價值
        setLoadingUsd(true);
        const ethGoal = fromWei(project.fundraisingGoal);
        const ethRaised = fromWei(project.totalDonated);
        
        try {
          const usdGoal = await ethToUsd(ethGoal);
          const usdRaised = await ethToUsd(ethRaised);
          
          setUsdValues({
            goal: usdGoal,
            raised: usdRaised
          });
        } catch (error) {
          console.error("USD轉換錯誤:", error);
          // 使用預設值
          const defaultRate = 3000;
          setUsdValues({
            goal: parseFloat(ethGoal) * defaultRate,
            raised: parseFloat(ethRaised) * defaultRate
          });
        } finally {
          setLoadingUsd(false);
        }
      } catch (error) {
        console.error("初始化錯誤:", error);
        setLoadingUsd(false);
      }
    };
    
    init();
  }, [project]);
  
  // 當捐款金額變化時，計算USD等值
  useEffect(() => {
    const updateUsdAmount = async () => {
      if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        try {
          setLoadingUsd(true);
          const usd = await ethToUsd(parseFloat(amount));
          setUsdAmount(usd);
        } catch (error) {
          console.error("計算USD金額錯誤:", error);
          // 使用預設值
          const defaultRate = 3000;
          setUsdAmount(parseFloat(amount) * defaultRate);
        } finally {
          setLoadingUsd(false);
        }
      } else {
        setUsdAmount(null);
      }
    };
    
    updateUsdAmount();
  }, [amount]);
  
  // 計算進度百分比
  const calculateProgress = () => {
    const raised = parseFloat(fromWei(project.totalDonated));
    const goal = parseFloat(fromWei(project.fundraisingGoal));
    return Math.min((raised / goal) * 100, 100);
  };
  
  // 處理金額變化
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // 驗證金額
    if (value && (isNaN(value) || parseFloat(value) <= 0)) {
      setError('請輸入有效的金額');
    } else if (value && parseFloat(value) > parseFloat(maxAmount)) {
      setError(`捐款金額不能超過您的可用餘額 (${maxAmount} ETH)`);
    } else {
      setError('');
    }
  };
  
  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 重置錯誤
    setError('');
    
    // 簡單驗證
    if (!amount) {
      setError('請輸入捐款金額');
      return;
    }
    
    // 驗證金額
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      setError('請輸入有效的捐款金額');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(maxAmount)) {
      setError(`捐款金額不能超過您的可用餘額 (${maxAmount} ETH)`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      // 提交捐款
      await onDonate(project.id, parseFloat(amount), message);
    } catch (error) {
      console.error("捐款提交錯誤:", error);
      setError('提交捐款時出錯，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="donation-form">
      <h2>向 {project.name} 捐款</h2>
      
      <div className="project-info">
        <p><strong>項目描述:</strong> {project.description}</p>
        <div className="project-progress">
          <div className="progress-info">
            <span>
              已籌集: {fromWei(project.totalDonated)} ETH
              <span className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  `(${usdValues.raised ? formatUsd(usdValues.raised) : 'N/A'})`
                )}
              </span>
            </span>
            <span>
              目標: {fromWei(project.fundraisingGoal)} ETH
              <span className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  `(${usdValues.goal ? formatUsd(usdValues.goal) : 'N/A'})`
                )}
              </span>
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{width: `${calculateProgress()}%`}}
            ></div>
          </div>
          <div className="progress-percentage">
            {calculateProgress().toFixed(1)}%
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">捐款金額 (ETH)</label>
          <div className="input-with-info">
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              placeholder="例如：0.1"
              step="0.001"
              min="0.001"
              disabled={isSubmitting}
              required
            />
            <div className="input-info">
              <button 
                type="button" 
                className="btn-max" 
                onClick={() => setAmount(maxAmount)}
                disabled={isSubmitting}
              >
                最大
              </button>
            </div>
          </div>
          {usdAmount && (
            <div className="usd-amount">
              估計金額: {loadingUsd ? (
                <span className="loading-inline">計算中...</span>
              ) : (
                formatUsd(usdAmount)
              )}
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="balance-info">
            您的可用餘額: {maxAmount} ETH
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="message">留言 (可選)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="添加一條支持的留言"
            rows="3"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            取消
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting || !!error}
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner"></span>
                處理中...
              </>
            ) : (
              <>確認捐款</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DonationForm; 