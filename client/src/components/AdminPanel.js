import React, { useState } from 'react';
import Web3 from 'web3';

function AdminPanel({ projects, toggleStatus, onCreateClick, onViewDetails, onBack }) {
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
  
  // 使用Web3.utils而不是依賴window.web3
  const fromWei = (value) => {
    try {
      const ethValue = Web3.utils.fromWei(value.toString(), 'ether');
      // 格式化ETH金額，顯示最多4位小數
      return parseFloat(parseFloat(ethValue).toFixed(4)).toString();
    } catch (error) {
      console.error("金額轉換錯誤:", error);
      return "0";
    }
  };

  // 篩選項目
  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    if (filter === 'active') return project.isActive;
    if (filter === 'inactive') return !project.isActive;
    return true;
  });

  return (
    <div className="admin-panel">
      <button className="btn btn-back" onClick={onBack}>
        <i className="fas fa-arrow-left"></i> 返回項目列表
      </button>
      
      <div className="admin-header">
        <h2>管理員控制面板</h2>
        <button className="btn btn-primary" onClick={onCreateClick}>
          <i className="fas fa-plus-circle"></i> 創建新項目
        </button>
      </div>
      
      <div className="admin-filters">
        <button 
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
        >
          所有項目
        </button>
        <button 
          className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('active')}
        >
          活躍項目
        </button>
        <button 
          className={`btn btn-sm ${filter === 'inactive' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('inactive')}
        >
          已關閉項目
        </button>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div className="no-projects">
          <i className="fas fa-folder-open"></i>
          <p>沒有符合條件的項目</p>
        </div>
      ) : (
        <div className="admin-projects-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>名稱</th>
                <th>目標金額</th>
                <th>已籌集</th>
                <th>進度</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id} className={!project.isActive ? 'inactive-row' : ''}>
                  <td>{project.id}</td>
                  <td>{project.name}</td>
                  <td>{fromWei(project.fundraisingGoal)} ETH</td>
                  <td>{fromWei(project.totalDonated)} ETH</td>
                  <td>
                    <div className="table-progress">
                      <div 
                        className="table-progress-bar" 
                        style={{
                          width: `${Math.min(
                            (parseFloat(fromWei(project.totalDonated)) / 
                            parseFloat(fromWei(project.fundraisingGoal))) * 100, 100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${project.isActive ? 'active' : 'inactive'}`}>
                      {project.isActive ? '活躍' : '已關閉'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="btn btn-sm btn-primary" 
                      onClick={() => onViewDetails(project)}
                      title="查看詳情"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className={`btn btn-sm ${project.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleStatus(project.id)}
                      title={project.isActive ? '關閉項目' : '重新開放項目'}
                    >
                      {project.isActive ? (
                        <i className="fas fa-times-circle"></i>
                      ) : (
                        <i className="fas fa-check-circle"></i>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminPanel; 