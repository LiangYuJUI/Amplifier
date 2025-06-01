import React, { useState } from 'react';

function ProjectForm({ createProject, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [fundraisingGoal, setFundraisingGoal] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 簡單驗證
    if (!name || !description || !beneficiary || !fundraisingGoal) {
      alert('請填寫所有必填字段');
      return;
    }
    
    // 驗證地址格式
    if (!beneficiary.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('請輸入有效的以太坊地址');
      return;
    }
    
    // 驗證籌款目標
    if (isNaN(fundraisingGoal) || parseFloat(fundraisingGoal) <= 0) {
      alert('請輸入有效的籌款目標金額');
      return;
    }
    
    // 提交表單
    createProject(name, description, beneficiary, parseFloat(fundraisingGoal));
  };
  
  return (
    <div className="project-form">
      <h2>創建新的慈善項目</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">項目名稱</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="輸入項目名稱"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">項目描述</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細描述項目目標和用途"
            rows="4"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="beneficiary">受益人地址</label>
          <input
            type="text"
            id="beneficiary"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="fundraisingGoal">籌款目標 (ETH)</label>
          <input
            type="number"
            id="fundraisingGoal"
            value={fundraisingGoal}
            onChange={(e) => setFundraisingGoal(e.target.value)}
            placeholder="例如：1.5"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="btn btn-primary">
            創建項目
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectForm; 