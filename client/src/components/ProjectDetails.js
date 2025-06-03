import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ethToUsd, formatUsd, formatEth } from '../utils/priceUtils';

function ProjectDetails({
  project,
  isOwner,
  isBeneficiary,
  toggleStatus,
  withdrawFunds,
  recordExpense,
  onDonate,
  onBack
}) {
  const [donations, setDonations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [expenseData, setExpenseData] = useState({
    description: '',
    amount: '',
    recipient: ''
  });
  const [loading, setLoading] = useState(false);
  const [usdValues, setUsdValues] = useState({
    goal: null,
    raised: null
  });
  const [loadingUsd, setLoadingUsd] = useState(false);
  const [usdError, setUsdError] = useState(false);
  const [availableBalance, setAvailableBalance] = useState('0');
  const [availableBalanceUsd, setAvailableBalanceUsd] = useState(null);
  
  // 使用Web3.utils而不是依賴window.web3，並格式化ETH金額顯示
  const fromWei = (value) => {
    try {
      const ethValue = Web3.utils.fromWei(value.toString(), 'ether');
      // 格式化ETH金額，顯示最多4位小數
      return parseFloat(parseFloat(ethValue).toFixed(4)).toString();
    } catch (error) {
      console.error("金額轉換錯誤:", error, value);
      return "0";
    }
  };
  
  // 計算進度百分比
  const calculateProgress = () => {
    try {
      const raised = parseFloat(fromWei(project.totalDonated));
      const goal = parseFloat(fromWei(project.fundraisingGoal));
      const percentage = (raised / goal) * 100;
      
      // 返回進度百分比，允許超過100%
      return percentage;
    } catch (error) {
      console.error("進度計算錯誤:", error);
      return 0;
    }
  };
  
  // 格式化進度顯示
  const formatProgress = (percentage) => {
    if (percentage >= 100) {
      return `${Math.floor(percentage)}% 🎉`;
    } else {
      return `${Math.floor(percentage)}%`;
    }
  };
  
  // 計算可用餘額
  const calculateAvailableBalance = (donationsArray, expensesArray) => {
    try {
      // 計算總捐款金額
      const totalDonated = project.totalDonated.toString();
      
      // 計算總支出金額
      let totalExpenses = 0;
      expensesArray.forEach(expense => {
        totalExpenses += Number(expense.amount);
      });
      
      // 計算可用餘額
      const availableBalanceWei = Number(totalDonated) - totalExpenses;
      const availableBalanceEth = fromWei(availableBalanceWei.toString());
      
      console.log("總捐款金額(wei):", totalDonated);
      console.log("總支出金額(wei):", totalExpenses.toString());
      console.log("可用餘額(wei):", availableBalanceWei.toString());
      console.log("可用餘額(ETH):", availableBalanceEth);
      
      return availableBalanceEth;
    } catch (error) {
      console.error("計算可用餘額錯誤:", error);
      return "0";
    }
  };
  
  // 加載項目數據（捐款和支出記錄）
  const loadData = async () => {
    try {
      if (!project || !project.id) return;
      
      setLoading(true);
      console.log("加載項目 ID:", project.id, "的捐款和支出記錄");
      
      // 獲取合約實例
      const web3 = new Web3(window.ethereum);
      const contractAddress = localStorage.getItem('contractAddress');
      const contractABI = JSON.parse(localStorage.getItem('contractABI'));
      
      if (!contractAddress || !contractABI) {
        console.error("合約信息不可用");
        return;
      }
      
      const contract = new web3.eth.Contract(contractABI, contractAddress);
      
      // 加載捐款記錄
      try {
        const donationCount = await contract.methods.getDonationCount(Number(project.id)).call();
        console.log(`項目 ${project.id} 有 ${donationCount} 筆捐款`);
        
        const donationsArray = [];
        
        for (let i = 0; i < Number(donationCount); i++) {
          try {
            const donation = await contract.methods.donations(Number(project.id), i).call();
            donationsArray.push(donation);
          } catch (donationError) {
            console.error(`獲取捐款詳情錯誤: 索引=${i}`, donationError);
          }
        }
        
        // 按時間戳排序，最新的排在前面
        donationsArray.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setDonations(donationsArray);
        console.log("捐款記錄加載完成:", donationsArray.length);
      } catch (donationError) {
        console.error("加載捐款記錄錯誤:", donationError);
        setDonations([]);
      }
      
      // 加載支出記錄
      try {
        const expenseCount = await contract.methods.getExpenseCount(Number(project.id)).call();
        console.log(`項目 ${project.id} 有 ${expenseCount} 筆支出`);
        
        const expensesArray = [];
        
        for (let i = 0; i < Number(expenseCount); i++) {
          try {
            const expense = await contract.methods.expenses(Number(project.id), i).call();
            expensesArray.push(expense);
          } catch (expenseError) {
            console.error(`獲取支出詳情錯誤: 索引=${i}`, expenseError);
          }
        }
        
        // 按時間戳排序，最新的排在前面
        expensesArray.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setExpenses(expensesArray);
        console.log("支出記錄加載完成:", expensesArray.length);
        
        // 計算可用餘額
        const balance = calculateAvailableBalance(donations, expensesArray);
        setAvailableBalance(balance);
        
        // 計算USD價值
        try {
          const balanceUsd = await ethToUsd(balance);
          setAvailableBalanceUsd(balanceUsd);
        } catch (usdError) {
          console.error("計算餘額USD價值錯誤:", usdError);
          // 使用預設匯率
          const defaultRate = 3000;
          setAvailableBalanceUsd(parseFloat(balance) * defaultRate);
        }
      } catch (expenseError) {
        console.error("加載支出記錄錯誤:", expenseError);
        setExpenses([]);
      }
    } catch (error) {
      console.error("加載項目詳情錯誤:", error);
      setDonations([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 加載ETH到USD匯率
  useEffect(() => {
    const loadUsdValues = async () => {
      if (!project) return;
      
      try {
        setLoadingUsd(true);
        setUsdError(false);
        console.log("正在加載項目USD價值...");
        console.log("項目籌款目標:", project.fundraisingGoal);
        console.log("已籌集金額:", project.totalDonated);
        
        const ethGoal = fromWei(project.fundraisingGoal);
        const ethRaised = fromWei(project.totalDonated);
        
        console.log("轉換後的ETH目標:", ethGoal);
        console.log("轉換後的ETH籌集:", ethRaised);
        
        try {
          const usdGoal = await ethToUsd(ethGoal);
          const usdRaised = await ethToUsd(ethRaised);
          
          console.log("USD目標:", usdGoal);
          console.log("USD籌集:", usdRaised);
          
          setUsdValues({
            goal: usdGoal,
            raised: usdRaised
          });
        } catch (conversionError) {
          console.error("ETH到USD轉換錯誤:", conversionError);
          setUsdError(true);
          
          // 使用預設匯率作為備用
          const defaultRate = 3000;
          setUsdValues({
            goal: parseFloat(ethGoal) * defaultRate,
            raised: parseFloat(ethRaised) * defaultRate
          });
        }
      } catch (error) {
        console.error("加載USD價格錯誤:", error);
        setUsdError(true);
      } finally {
        setLoadingUsd(false);
      }
    };
    
    if (project) {
      loadUsdValues();
      loadData();
    }
  }, [project]);
  
  // 處理提取資金
  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      alert('請輸入有效的提取金額');
      return;
    }
    
    // 檢查提取金額是否超過可用餘額
    if (parseFloat(withdrawAmount) > parseFloat(availableBalance)) {
      alert(`提取金額超過可用餘額 ${availableBalance} ETH`);
      return;
    }
    
    try {
      await withdrawFunds(project.id, parseFloat(withdrawAmount));
      
      // 清空表單數據
      setWithdrawAmount('');
      
      // 重新加載數據
      await loadData();
      
      // 顯示成功消息
      alert('提取資金成功！');
    } catch (error) {
      console.error("提取資金時發生錯誤:", error);
      alert('提取資金失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  // 處理記錄支出
  const handleRecordExpense = async (e) => {
    e.preventDefault();
    
    const { description, amount, recipient } = expenseData;
    
    if (!description || !amount || !recipient) {
      alert('請填寫所有必填字段');
      return;
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('請輸入有效的支出金額');
      return;
    }
    
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('請輸入有效的接收者地址');
      return;
    }
    
    try {
      await recordExpense(project.id, description, parseFloat(amount), recipient);
      
      // 清空表單數據
      setExpenseData({
        description: '',
        amount: '',
        recipient: ''
      });
      
      // 重新加載數據
      await loadData();
      
      // 顯示成功消息
      alert('記錄支出成功！');
    } catch (error) {
      console.error("記錄支出時發生錯誤:", error);
      alert('記錄支出失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  // 處理支出表單輸入變化
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 設置最大提取金額
  const setMaxWithdrawAmount = () => {
    setWithdrawAmount(availableBalance);
  };
  
  // 提取資金並記錄支出
  const handleWithdrawAndRecord = async (e) => {
    e.preventDefault();
    
    // 檢查提取金額和支出表單是否填寫完整
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      alert('請輸入有效的提取金額');
      return;
    }
    
    // 檢查提取金額是否超過可用餘額
    if (parseFloat(withdrawAmount) > parseFloat(availableBalance)) {
      alert(`提取金額超過可用餘額 ${availableBalance} ETH`);
      return;
    }
    
    const { description, recipient } = expenseData;
    
    if (!description || !recipient) {
      alert('請填寫支出描述和接收者地址');
      return;
    }
    
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('請輸入有效的接收者地址');
      return;
    }
    
    try {
      // 先提取資金
      await withdrawFunds(project.id, parseFloat(withdrawAmount));
      
      // 然後記錄支出
      await recordExpense(project.id, description, parseFloat(withdrawAmount), recipient);
      
      // 清空表單數據
      setWithdrawAmount('');
      setExpenseData({
        description: '',
        amount: '',
        recipient: ''
      });
      
      // 重新加載數據
      await loadData();
      
      // 顯示成功消息
      alert('提取資金並記錄支出成功！');
    } catch (error) {
      console.error("提取資金並記錄支出時發生錯誤:", error);
      alert('操作失敗: ' + (error.message || '未知錯誤'));
    }
  };
  
  // 刷新USD匯率
  const refreshUsdRate = () => {
    // 直接調用 loadUsdValues 函數的邏輯，而不是嘗試調用未定義的函數
    if (!project) return;
    
    const loadRates = async () => {
      try {
        setLoadingUsd(true);
        setUsdError(false);
        
        const ethGoal = fromWei(project.fundraisingGoal);
        const ethRaised = fromWei(project.totalDonated);
        
        try {
          const usdGoal = await ethToUsd(ethGoal);
          const usdRaised = await ethToUsd(ethRaised);
          
          setUsdValues({
            goal: usdGoal,
            raised: usdRaised
          });
          
          // 更新可用餘額的USD價值
          const balanceUsd = await ethToUsd(availableBalance);
          setAvailableBalanceUsd(balanceUsd);
        } catch (conversionError) {
          console.error("刷新ETH到USD轉換錯誤:", conversionError);
          setUsdError(true);
          
          // 使用預設匯率作為備用
          const defaultRate = 3000;
          setUsdValues({
            goal: parseFloat(ethGoal) * defaultRate,
            raised: parseFloat(ethRaised) * defaultRate
          });
          setAvailableBalanceUsd(parseFloat(availableBalance) * defaultRate);
        }
      } catch (error) {
        console.error("刷新USD價格錯誤:", error);
        setUsdError(true);
      } finally {
        setLoadingUsd(false);
      }
    };
    
    loadRates();
  };
  
  if (!project) {
    return <div>加載中...</div>;
  }
  
  // 檢查項目數據是否有效
  console.log("項目詳情:", project);
  console.log("是否為受益人:", isBeneficiary);
  console.log("當前賬戶:", window.ethereum.selectedAddress);
  console.log("項目受益人:", project.beneficiary);
  
  return (
    <div className="project-details">
      <button className="btn btn-back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> 返回項目列表
      </button>
      
      <h2>{project.name}</h2>
      
      <div className="project-info">
        <p className="project-description">{project.description}</p>
        
        <div className="project-progress">
          <div className="progress-info">
            <span>
              已籌集: {fromWei(project.totalDonated)} ETH
              <span className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  <>
                    ({usdValues.raised ? formatUsd(usdValues.raised) : 'N/A'})
                    {usdError && <span className="error-badge">估計</span>}
                  </>
                )}
              </span>
            </span>
            <span>
              目標: {fromWei(project.fundraisingGoal)} ETH
              <span className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  <>
                    ({usdValues.goal ? formatUsd(usdValues.goal) : 'N/A'})
                    {usdError && <span className="error-badge">估計</span>}
                  </>
                )}
              </span>
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-bar-fill ${calculateProgress() >= 100 ? 'completed' : ''}`}
              style={{width: `${Math.min(calculateProgress(), 100)}%`}}
            ></div>
          </div>
          <div className="progress-percentage">
            {formatProgress(calculateProgress())}
          </div>
        </div>
        
        <div className="project-stats">
          <div className="stat">
            <span className="stat-label">目標金額</span>
            <span className="stat-value">
              {fromWei(project.fundraisingGoal)} ETH
              <div className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  <>
                    {usdValues.goal ? formatUsd(usdValues.goal) : 'N/A'}
                    {usdError && <span className="error-badge">估計</span>}
                  </>
                )}
              </div>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">已籌集</span>
            <span className="stat-value">
              {fromWei(project.totalDonated)} ETH
              <div className="usd-value">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  <>
                    {usdValues.raised ? formatUsd(usdValues.raised) : 'N/A'}
                    {usdError && <span className="error-badge">估計</span>}
                  </>
                )}
              </div>
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">狀態</span>
            <span className={`stat-value ${project.isActive ? 'active' : 'inactive'}`}>
              {project.isActive ? '活躍' : '已關閉'}
            </span>
          </div>
        </div>
        
        <div className="project-meta">
          <p><strong>受益人:</strong> <span className="address-text">{project.beneficiary}</span></p>
          <p><strong>創建時間:</strong> {project.createdAt}</p>
        </div>
      </div>
      
      <div className="project-actions">
        {project.isActive && (
          <button className="btn btn-primary" onClick={onDonate}>
            <i className="fas fa-hand-holding-usd"></i> 捐款
          </button>
        )}
        
        {isOwner && (
          <button
            className={`btn ${project.isActive ? 'btn-warning' : 'btn-success'}`}
            onClick={() => toggleStatus(project.id)}
          >
            {project.isActive ? (
              <><i className="fas fa-times-circle"></i> 關閉項目</>
            ) : (
              <><i className="fas fa-check-circle"></i> 重新開放項目</>
            )}
          </button>
        )}
      </div>
      
      {isBeneficiary && (
        <div className="beneficiary-section">
          <h3>受益人操作</h3>
          
          <div className="available-balance-info">
            <h4>可提取資金餘額</h4>
            <div className="balance-display">
              <span className="balance-amount">{availableBalance} ETH</span>
              <span className="balance-usd">
                {loadingUsd ? (
                  <span className="loading-inline">計算中...</span>
                ) : (
                  <>
                    ({availableBalanceUsd ? formatUsd(availableBalanceUsd) : 'N/A'})
                    {usdError && <span className="error-badge">估計</span>}
                  </>
                )}
              </span>
              <button 
                className="btn-refresh-balance" 
                onClick={loadData}
                title="刷新餘額"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
          
          <div className="withdraw-section">
            <h4>提取資金</h4>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label htmlFor="withdrawAmount">提取金額 (ETH)</label>
                <div className="input-with-max">
                  <input
                    type="number"
                    id="withdrawAmount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="例如：0.5"
                    step="0.01"
                    min="0"
                    max={availableBalance}
                    required
                  />
                  <button 
                    type="button" 
                    className="btn-max" 
                    onClick={setMaxWithdrawAmount}
                    title="設置最大可提取金額"
                  >
                    最大
                  </button>
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={parseFloat(availableBalance) <= 0}
              >
                提取
              </button>
            </form>
          </div>
          
          <div className="expense-section">
            <h4>記錄支出</h4>
            <form onSubmit={handleRecordExpense}>
              <div className="form-group">
                <label htmlFor="description">支出描述</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={expenseData.description}
                  onChange={handleExpenseChange}
                  placeholder="支出用途"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="amount">支出金額 (ETH)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={expenseData.amount}
                  onChange={handleExpenseChange}
                  placeholder="例如：0.2"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="recipient">接收者地址</label>
                <input
                  type="text"
                  id="recipient"
                  name="recipient"
                  value={expenseData.recipient}
                  onChange={handleExpenseChange}
                  placeholder="0x..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                記錄支出
              </button>
            </form>
          </div>
          
          <div className="combined-action-section">
            <h4>提取資金並記錄支出</h4>
            <p>使用上面填寫的提取金額和支出信息，一次性完成提取和記錄</p>
            <button 
              className="btn btn-primary btn-combined-action"
              onClick={handleWithdrawAndRecord}
              disabled={!withdrawAmount || !expenseData.description || !expenseData.recipient || parseFloat(availableBalance) <= 0}
            >
              <i className="fas fa-exchange-alt"></i> 提取並記錄
            </button>
          </div>
        </div>
      )}
      
      <div className="records-section">
        <div className="donations-section">
          <h3>捐款記錄</h3>
          {loading ? (
            <p>加載中...</p>
          ) : donations.length === 0 ? (
            <p>暫無捐款記錄</p>
          ) : (
            <ul className="donations-list">
              {donations.map((donation, index) => (
                <li key={index} className="donation-item">
                  <div className="donation-info">
                    <span className="donation-amount">{Web3.utils.fromWei(donation.amount.toString(), 'ether')} ETH</span>
                    <span className="donation-donor">{donation.donor.substring(0, 6)}...{donation.donor.substring(donation.donor.length - 4)}</span>
                    <span className="donation-time">{new Date(Number(donation.timestamp) * 1000).toLocaleString()}</span>
                  </div>
                  {donation.message && (
                    <p className="donation-message">{donation.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="expenses-section">
          <h3>支出記錄</h3>
          {loading ? (
            <p>加載中...</p>
          ) : expenses.length === 0 ? (
            <p>暫無支出記錄</p>
          ) : (
            <ul className="expenses-list">
              {expenses.map((expense, index) => (
                <li key={index} className="expense-item">
                  <div className="expense-info">
                    <span className="expense-amount">{Web3.utils.fromWei(expense.amount.toString(), 'ether')} ETH</span>
                    <span className="expense-description">{expense.description}</span>
                    <span className="expense-time">{new Date(Number(expense.timestamp) * 1000).toLocaleString()}</span>
                  </div>
                  <div className="expense-recipient">
                    <span>接收者: {expense.recipient.substring(0, 6)}...{expense.recipient.substring(expense.recipient.length - 4)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails; 