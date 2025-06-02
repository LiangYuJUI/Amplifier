import React from 'react';

function Header({ account, isOwner, isWalletConnected, onConnectWallet, onSwitchWallet }) {
  return (
    <header className="app-header">
      <div className="container">
        <div className="header-left">
          <button className="btn btn-home" onClick={() => window.location.href = '/'}>
            <i className="fas fa-home"></i> 首頁
          </button>
          <div className="header-brand">
            <h1>
              <i className="fas fa-hand-holding-heart"></i> 
              區塊鏈透明慈善捐贈平台
            </h1>
          </div>
        </div>
        
        <div className="account-info">
          {isWalletConnected && account ? (
            <div className="connected-wallet">
              <div className="wallet-status">
                <span className="connection-dot"></span>
                <span className="connection-text">已連接</span>
              </div>
              <span className="account-address">
                <i className="fas fa-user-circle"></i>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              {isOwner && <span className="owner-badge">
                <i className="fas fa-crown"></i> 管理員
              </span>}
              <div className="wallet-actions">
                <button className="btn btn-switch" onClick={onSwitchWallet} title="切換錢包">
                  <i className="fas fa-exchange-alt"></i>
                </button>
                <button className="btn btn-reconnect" onClick={onConnectWallet} title="重新連接錢包">
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-connect" onClick={onConnectWallet}>
              <i className="fas fa-wallet"></i> 連接錢包
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 