import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { formatEth, ethToUsd } from '../utils/priceUtils';

function DonationHistory({ contract, web3, projects }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsd, setLoadingUsd] = useState(false);
  const [usdError, setUsdError] = useState(false);

  // 加載所有項目的捐款記錄
  useEffect(() => {
    const loadDonations = async () => {
      if (!contract || !web3 || !projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("開始加載捐款歷史記錄...");

        // 從所有項目獲取捐款記錄
        const allDonations = [];

        for (const project of projects) {
          const projectId = project.id;
          try {
            // 確保projectId是數字
            const donationCount = await contract.methods.getDonationCount(Number(projectId)).call();
            console.log(`項目 ${projectId} 有 ${donationCount} 筆捐款`);

            // 獲取每個捐款的詳細信息
            for (let i = 0; i < Number(donationCount); i++) {
              try {
                const donation = await contract.methods.donations(Number(projectId), i).call();
                
                console.log(`加載捐款記錄: 項目ID=${projectId}, 索引=${i}, 金額=${donation.amount}`);
                
                // 添加項目信息到捐款記錄
                allDonations.push({
                  ...donation,
                  projectId,
                  projectName: project.name,
                  ethAmount: web3.utils.fromWei(donation.amount.toString(), 'ether')
                });
              } catch (donationError) {
                console.error(`獲取捐款詳情錯誤: 項目ID=${projectId}, 索引=${i}`, donationError);
              }
            }
          } catch (countError) {
            console.error(`獲取捐款數量錯誤: 項目ID=${projectId}`, countError);
          }
        }

        // 按時間戳排序，最新的排在前面
        allDonations.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        
        console.log(`總共加載了 ${allDonations.length} 筆捐款記錄`);
        setDonations(allDonations);
        
        // 加載USD金額
        if (allDonations.length > 0) {
          loadUsdValues(allDonations);
        }
      } catch (error) {
        console.error("加載捐款歷史記錄錯誤:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, [contract, web3, projects]);

  // 加載ETH到USD的換算
  const loadUsdValues = async (donationsList) => {
    try {
      setLoadingUsd(true);
      setUsdError(false);

      const updatedDonations = await Promise.all(donationsList.map(async (donation) => {
        try {
          const usdAmount = await ethToUsd(donation.ethAmount);
          return { ...donation, usdAmount };
        } catch (error) {
          console.error(`捐款 ${donation.ethAmount} ETH 的USD轉換錯誤:`, error);
          // 使用預設匯率作為備用
          const defaultRate = 3000;
          return { 
            ...donation, 
            usdAmount: parseFloat(donation.ethAmount) * defaultRate,
            usdError: true 
          };
        }
      }));

      setDonations(updatedDonations);
    } catch (error) {
      console.error("加載USD價格錯誤:", error);
      setUsdError(true);
    } finally {
      setLoadingUsd(false);
    }
  };

  // 格式化時間戳
  const formatTimestamp = (timestamp) => {
    // 確保timestamp是數字而不是BigInt
    const timestampNum = Number(timestamp);
    const date = new Date(timestampNum * 1000);
    return date.toLocaleString();
  };

  // 格式化地址顯示
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 格式化USD金額
  const formatUsd = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="donation-history loading">
        <div className="loading-spinner"></div>
        <p>加載捐款歷史記錄中...</p>
      </div>
    );
  }

  return (
    <div className="donation-history">
      <h2>捐款歷史記錄</h2>
      
      {donations.length === 0 ? (
        <p className="no-donations">目前沒有捐款記錄</p>
      ) : (
        <div className="donation-stream">
          {donations.map((donation, index) => (
            <div key={`${donation.projectId}-${index}`} className="donation-card">
              <div className="donation-header">
                <span className="donation-project">{donation.projectName}</span>
                <span className="donation-time">{formatTimestamp(donation.timestamp)}</span>
              </div>
              
              <div className="donation-body">
                <div className="donation-amount">
                  {formatEth(donation.ethAmount)} ETH
                  <span className="usd-value">
                    {loadingUsd ? (
                      <span className="loading-inline">計算中...</span>
                    ) : (
                      <>
                        ({donation.usdAmount ? formatUsd(donation.usdAmount) : 'N/A'})
                        {donation.usdError && <span className="error-badge">估計</span>}
                      </>
                    )}
                  </span>
                </div>
                
                <div className="donation-donor">
                  <i className="fas fa-user"></i> {formatAddress(donation.donor)}
                </div>
                
                {donation.message && (
                  <div className="donation-message">
                    <i className="fas fa-quote-left"></i> {donation.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonationHistory; 