import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { ethToUsd, formatUsd, formatEth } from '../utils/priceUtils';

function ProjectList({ projects, onProjectClick, isOwner, onCreateClick }) {
  const [ethUsdRate, setEthUsdRate] = useState(null);
  const [projectsWithUsd, setProjectsWithUsd] = useState([]);
  const [loadingUsd, setLoadingUsd] = useState(false);
  const [usdError, setUsdError] = useState(false);
  
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

  // 計算進度百分比
  const calculateProgress = (raised, goal) => {
    try {
      const raisedNum = parseFloat(fromWei(raised));
      const goalNum = parseFloat(fromWei(goal));
      const percentage = (raisedNum / goalNum) * 100;
      
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
  
  // 加載ETH到USD匯率並計算USD金額
  useEffect(() => {
    const loadUsdValues = async () => {
      try {
        if (projects.length === 0) {
          setProjectsWithUsd([]);
          return;
        }
        
        setLoadingUsd(true);
        setUsdError(false);
        
        // 為每個項目添加USD金額
        const updatedProjects = await Promise.all(projects.map(async (project) => {
          const ethGoal = fromWei(project.fundraisingGoal);
          const ethRaised = fromWei(project.totalDonated);
          
          try {
            console.log("轉換ETH到USD:", ethGoal, ethRaised);
            const usdGoal = await ethToUsd(ethGoal);
            const usdRaised = await ethToUsd(ethRaised);
            
            console.log("轉換結果:", usdGoal, usdRaised);
            
            return {
              ...project,
              usdGoal,
              usdRaised,
              usdError: false
            };
          } catch (error) {
            console.error(`項目 ${project.id} 的USD轉換錯誤:`, error);
            
            // 使用預設匯率作為備用
            const defaultRate = 3000;
            return {
              ...project,
              usdGoal: parseFloat(ethGoal) * defaultRate,
              usdRaised: parseFloat(ethRaised) * defaultRate,
              usdError: true
            };
          }
        }));
        
        setProjectsWithUsd(updatedProjects);
      } catch (error) {
        console.error("加載USD價格錯誤:", error);
        setUsdError(true);
        
        // 如果無法獲取USD價格，使用原始項目但添加錯誤標記
        const projectsWithError = projects.map(project => ({
          ...project,
          usdError: true
        }));
        setProjectsWithUsd(projectsWithError);
      } finally {
        setLoadingUsd(false);
      }
    };
    
    loadUsdValues();
  }, [projects]);

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>慈善項目列表</h2>
        {isOwner && (
          <button className="btn btn-primary" onClick={onCreateClick}>
            <i className="fas fa-plus-circle"></i> 創建新項目
          </button>
        )}
      </div>
      
      {projectsWithUsd.length === 0 ? (
        <div className="no-projects">
          <i className="fas fa-hands-helping"></i>
          <p>目前沒有慈善項目</p>
          {isOwner && (
            <button className="btn btn-primary" onClick={onCreateClick}>
              <i className="fas fa-plus-circle"></i> 創建第一個項目
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projectsWithUsd.map(project => (
            <div
              key={project.id}
              className={`project-card ${!project.isActive ? 'inactive' : ''}`}
              onClick={() => onProjectClick(project)}
            >
              <h3>{project.name}</h3>
              <p className="project-description">
                {project.description.length > 100 
                  ? `${project.description.substring(0, 100)}...` 
                  : project.description}
              </p>
              
              <div className="project-progress">
                <div className="progress-info">
                  <span>
                    已籌集: {fromWei(project.totalDonated)} ETH
                    <span className="usd-value">
                      {loadingUsd ? (
                        <span className="loading-inline">計算中...</span>
                      ) : (
                        <>
                          ({project.usdRaised ? formatUsd(project.usdRaised) : 'N/A'})
                          {project.usdError && <span className="error-badge">估計</span>}
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
                          ({project.usdGoal ? formatUsd(project.usdGoal) : 'N/A'})
                          {project.usdError && <span className="error-badge">估計</span>}
                        </>
                      )}
                    </span>
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-bar-fill ${calculateProgress(project.totalDonated, project.fundraisingGoal) >= 100 ? 'completed' : ''}`}
                    style={{width: `${Math.min(calculateProgress(project.totalDonated, project.fundraisingGoal), 100)}%`}}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {formatProgress(calculateProgress(project.totalDonated, project.fundraisingGoal))}
                </div>
              </div>
              
              <div className="project-stats">
                <div className="stat">
                  <span className="stat-label">狀態</span>
                  <span className={`stat-value project-status ${project.isActive ? 'active' : 'inactive'}`}>
                    {project.isActive ? '活躍' : '已關閉'}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">創建時間</span>
                  <span className="stat-value project-date">
                    <i className="far fa-calendar-alt"></i> {project.createdAt.split(' ')[0]}
                  </span>
                </div>
              </div>
              
              <div className="project-footer">
                <span className="project-beneficiary tooltip">
                  <i className="fas fa-user"></i> 受益人
                  <span className="tooltip-text">
                    {`${project.beneficiary.substring(0, 6)}...${project.beneficiary.substring(project.beneficiary.length - 4)}`}
                  </span>
                </span>
                <button className="btn btn-sm btn-primary">
                  查看詳情 <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList; 