import React, { useState } from 'react';
import DonationHistory from './DonationHistory';
import DonationRanking from './DonationRanking';

function DonationStats({ contract, web3, projects }) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' 或 'ranking'

  return (
    <div className="donation-stats">
      <div className="stats-tabs">
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="fas fa-history"></i> 捐款歷史
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          <i className="fas fa-trophy"></i> 捐款排行榜
        </button>
      </div>
      
      <div className="stats-content">
        {activeTab === 'history' ? (
          <DonationHistory contract={contract} web3={web3} projects={projects} />
        ) : (
          <DonationRanking contract={contract} web3={web3} projects={projects} />
        )}
      </div>
    </div>
  );
}

export default DonationStats; 