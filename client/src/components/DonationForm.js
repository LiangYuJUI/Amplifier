import React, { useState } from 'react';
import Web3 from 'web3';

function DonationForm({ project, onDonate, onCancel }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  // 使用Web3.utils而不是依賴window.web3
  const fromWei = (value) => {
    return Web3.utils.fromWei(value.toString(), 'ether');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 簡單驗證
    if (!amount) {
      alert('請輸入捐款金額');
      return;
    }
    
    // 驗證金額
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      alert('請輸入有效的捐款金額');
      return;
    }
    
    // 提交捐款
    onDonate(project.id, parseFloat(amount), message);
  };
  
  return (
    <div className="donation-form">
      <h2>向 {project.name} 捐款</h2>
      
      <div className="project-info">
        <p><strong>項目描述:</strong> {project.description}</p>
        <p><strong>目標金額:</strong> {fromWei(project.fundraisingGoal)} ETH</p>
        <p><strong>已籌集:</strong> {fromWei(project.totalDonated)} ETH</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">捐款金額 (ETH)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例如：0.1"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">留言 (可選)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="添加一條支持的留言"
            rows="3"
          />
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn btn-primary">
            確認捐款
          </button>
        </div>
      </form>
    </div>
  );
}

export default DonationForm; 