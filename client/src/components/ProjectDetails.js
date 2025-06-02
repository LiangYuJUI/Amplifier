import React, { useState, useEffect } from 'react';
import Web3 from 'web3';

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
  
  // 加載捐款和支出記錄
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 這裡應該從合約加載捐款和支出記錄
        // 但由於我們沒有實現這些功能，所以這裡只是示例
        setDonations([]);
        setExpenses([]);
      } catch (error) {
        console.error("加載項目詳情錯誤:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (project) {
      loadData();
    }
  }, [project]);
  
  // 處理提取資金
  const handleWithdraw = (e) => {
    e.preventDefault();
    
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      alert('請輸入有效的提取金額');
      return;
    }
    
    withdrawFunds(project.id, parseFloat(withdrawAmount));
    setWithdrawAmount('');
  };
  
  // 處理記錄支出
  const handleRecordExpense = (e) => {
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
    
    recordExpense(project.id, description, parseFloat(amount), recipient);
    
    setExpenseData({
      description: '',
      amount: '',
      recipient: ''
    });
  };
  
  // 處理支出表單輸入變化
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (!project) {
    return <div>加載中...</div>;
  }
  
  // 檢查項目數據是否有效
  console.log("項目詳情:", project);
  
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
            <span>已籌集: {fromWei(project.totalDonated)} ETH</span>
            <span>目標: {fromWei(project.fundraisingGoal)} ETH</span>
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
            <span className="stat-value">{fromWei(project.fundraisingGoal)} ETH</span>
          </div>
          <div className="stat">
            <span className="stat-label">已籌集</span>
            <span className="stat-value">{fromWei(project.totalDonated)} ETH</span>
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
          
          <div className="withdraw-section">
            <h4>提取資金</h4>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label htmlFor="withdrawAmount">提取金額 (ETH)</label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="例如：0.5"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
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
                    <span className="donation-amount">{Web3.utils.fromWei(donation.amount, 'ether')} ETH</span>
                    <span className="donation-donor">{donation.donor.substring(0, 6)}...{donation.donor.substring(donation.donor.length - 4)}</span>
                    <span className="donation-time">{new Date(donation.timestamp * 1000).toLocaleString()}</span>
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
                    <span className="expense-amount">{Web3.utils.fromWei(expense.amount, 'ether')} ETH</span>
                    <span className="expense-description">{expense.description}</span>
                    <span className="expense-time">{new Date(expense.timestamp * 1000).toLocaleString()}</span>
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