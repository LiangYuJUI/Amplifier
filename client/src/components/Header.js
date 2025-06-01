import React from 'react';

function Header({ account, isOwner, isWalletConnected, onConnectWallet }) {
  return (
    <header className="app-header">
      <div className="container">
        <h1>區塊鏈透明慈善捐贈平台</h1>
        <div className="account-info">
          {isWalletConnected && account ? (
            <div className="connected-wallet">
              <span className="account-address">
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </span>
              {isOwner && <span className="owner-badge">管理員</span>}
              <button className="btn btn-reconnect" onClick={onConnectWallet} title="重新連接錢包">
                <i className="fa fa-refresh"></i>
              </button>
            </div>
          ) : (
            <button className="btn btn-connect" onClick={onConnectWallet}>
              連接錢包
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header; 