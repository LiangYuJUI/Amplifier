import React from 'react';
import Web3 from 'web3';

function ProjectList({ projects, onProjectClick, isOwner, onCreateClick }) {
  // 使用Web3.utils而不是依賴window.web3
  const fromWei = (value) => {
    return Web3.utils.fromWei(value.toString(), 'ether');
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>慈善項目列表</h2>
        {isOwner && (
          <button className="btn btn-primary" onClick={onCreateClick}>
            創建新項目
          </button>
        )}
      </div>
      
      {projects.length === 0 ? (
        <div className="no-projects">
          <p>目前沒有慈善項目</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-card ${!project.isActive ? 'inactive' : ''}`}
              onClick={() => onProjectClick(project)}
            >
              <h3>{project.name}</h3>
              <p className="project-description">{project.description.substring(0, 100)}...</p>
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-label">目標</span>
                  <span className="stat-value">{fromWei(project.fundraisingGoal)} ETH</span>
                </div>
                <div className="stat">
                  <span className="stat-label">已籌集</span>
                  <span className="stat-value">{fromWei(project.totalDonated)} ETH</span>
                </div>
              </div>
              <div className="project-footer">
                <span className="project-status">{project.isActive ? '活躍' : '已關閉'}</span>
                <span className="project-date">{project.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList; 