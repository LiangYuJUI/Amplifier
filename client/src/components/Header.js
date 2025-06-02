import React from 'react';

function Header({ account, isOwner, isWalletConnected, onConnectWallet, onSwitchWallet, onAdminClick }) {
  // 格式化地址顯示
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // 處理首頁按鈕點擊
  const handleHomeClick = () => {
    window.location.href = '/';
  };
  
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-left">
          <button className="btn-home" onClick={handleHomeClick}>
            <i className="fas fa-home"></i> 首頁
          </button>
          <div className="header-brand">
            <h1><i className="fas fa-hand-holding-heart"></i> 區塊鏈透明慈善捐贈平台</h1>
          </div>
        </div>
        
        <div className="account-info">
          {isWalletConnected ? (
            <div className="connected-wallet">
              <div className="wallet-status">
                <span className="connection-dot"></span>
                已連接
              </div>
              <div className="account-address">
                {formatAddress(account)}
                {isOwner && <span className="owner-badge">管理員</span>}
              </div>
              <div className="wallet-actions">
                <button 
                  className="btn-switch" 
                  onClick={onSwitchWallet}
                  title="切換錢包"
                >
                  <i className="fas fa-exchange-alt"></i>
                </button>
                <button 
                  className="btn-reconnect" 
                  onClick={onConnectWallet}
                  title="重新連接"
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
                {isOwner && (
                  <button 
                    className="btn-admin" 
                    onClick={onAdminClick}
                    title="管理員面板"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button className="btn-connect" onClick={onConnectWallet}>
              <i className="fas fa-wallet"></i> 連接錢包
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 