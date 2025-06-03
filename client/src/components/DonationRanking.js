import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { formatEth, ethToUsd } from '../utils/priceUtils';

function DonationRanking({ contract, web3, projects }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsd, setLoadingUsd] = useState(false);
  const [usdError, setUsdError] = useState(false);
  const [rankingType, setRankingType] = useState('amount'); // 'amount' 或 'count'

  // 加載所有項目的捐款記錄並計算排行榜
  useEffect(() => {
    const loadDonors = async () => {
      if (!contract || !web3 || !projects || projects.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("開始計算捐款排行榜...");

        // 從所有項目獲取捐款記錄
        const allDonations = [];
        const donorMap = new Map(); // 用於統計每個捐款者的總捐款金額和次數

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
                
                console.log(`處理捐款記錄: 項目ID=${projectId}, 索引=${i}, 金額=${donation.amount}`);
                
                // 添加項目信息到捐款記錄
                allDonations.push({
                  ...donation,
                  projectId,
                  projectName: project.name,
                  ethAmount: web3.utils.fromWei(donation.amount.toString(), 'ether')
                });

                // 更新捐款者統計
                const donorAddress = donation.donor;
                const ethAmount = web3.utils.fromWei(donation.amount.toString(), 'ether');
                
                if (donorMap.has(donorAddress)) {
                  const donor = donorMap.get(donorAddress);
                  donor.totalAmount = parseFloat(donor.totalAmount) + parseFloat(ethAmount);
                  donor.donationCount += 1;
                  donor.lastDonation = Math.max(donor.lastDonation, Number(donation.timestamp));
                } else {
                  donorMap.set(donorAddress, {
                    address: donorAddress,
                    totalAmount: parseFloat(ethAmount),
                    donationCount: 1,
                    lastDonation: Number(donation.timestamp)
                  });
                }
              } catch (donationError) {
                console.error(`獲取捐款詳情錯誤: 項目ID=${projectId}, 索引=${i}`, donationError);
              }
            }
          } catch (countError) {
            console.error(`獲取捐款數量錯誤: 項目ID=${projectId}`, countError);
          }
        }

        // 轉換Map為數組並排序
        const donorArray = Array.from(donorMap.values());
        sortDonors(donorArray, rankingType);
        
        console.log(`總共有 ${donorArray.length} 位捐款者`);
        setDonors(donorArray);
        
        // 加載USD金額
        if (donorArray.length > 0) {
          loadUsdValues(donorArray);
        }
      } catch (error) {
        console.error("加載捐款排行榜錯誤:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, [contract, web3, projects, rankingType]);

  // 根據選擇的類型排序捐款者
  const sortDonors = (donorArray, type) => {
    if (type === 'amount') {
      // 按捐款總額排序
      donorArray.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (type === 'count') {
      // 按捐款次數排序
      donorArray.sort((a, b) => b.donationCount - a.donationCount);
    }
  };

  // 切換排序類型
  const toggleRankingType = () => {
    setRankingType(prev => prev === 'amount' ? 'count' : 'amount');
  };

  // 加載ETH到USD的換算
  const loadUsdValues = async (donorArray) => {
    try {
      setLoadingUsd(true);
      setUsdError(false);

      const updatedDonors = await Promise.all(donorArray.map(async (donor) => {
        try {
          const usdAmount = await ethToUsd(donor.totalAmount.toString());
          return { ...donor, usdAmount };
        } catch (error) {
          console.error(`捐款者 ${donor.address} 的USD轉換錯誤:`, error);
          // 使用預設匯率作為備用
          const defaultRate = 3000;
          return { 
            ...donor, 
            usdAmount: donor.totalAmount * defaultRate,
            usdError: true 
          };
        }
      }));

      setDonors(updatedDonors);
    } catch (error) {
      console.error("加載USD價格錯誤:", error);
      setUsdError(true);
    } finally {
      setLoadingUsd(false);
    }
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
      <div className="donation-ranking loading">
        <div className="loading-spinner"></div>
        <p>計算捐款排行榜中...</p>
      </div>
    );
  }

  return (
    <div className="donation-ranking">
      <div className="ranking-header">
        <h2>捐款排行榜</h2>
        <button 
          className="btn btn-sm btn-secondary" 
          onClick={toggleRankingType}
        >
          {rankingType === 'amount' ? '按捐款金額排序' : '按捐款次數排序'}
          <i className="fas fa-exchange-alt ml-2"></i>
        </button>
      </div>
      
      {donors.length === 0 ? (
        <p className="no-donors">目前沒有捐款記錄</p>
      ) : (
        <div className="ranking-table-container">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>捐款者</th>
                <th>{rankingType === 'amount' ? '捐款總額' : '捐款次數'}</th>
                <th>{rankingType === 'amount' ? '捐款次數' : '捐款總額'}</th>
              </tr>
            </thead>
            <tbody>
              {donors.slice(0, 10).map((donor, index) => (
                <tr key={donor.address} className={index < 3 ? `top-${index + 1}` : ''}>
                  <td className="rank">
                    {index < 3 ? (
                      <span className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </span>
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="donor-address">
                    <i className="fas fa-user-circle"></i> {formatAddress(donor.address)}
                  </td>
                  <td className="donation-value">
                    {rankingType === 'amount' ? (
                      <>
                        <span className="eth-amount">{donor.totalAmount.toFixed(4)} ETH</span>
                        <span className="usd-value">
                          {loadingUsd ? (
                            <span className="loading-inline">計算中...</span>
                          ) : (
                            <>
                              ({donor.usdAmount ? formatUsd(donor.usdAmount) : 'N/A'})
                              {donor.usdError && <span className="error-badge">估計</span>}
                            </>
                          )}
                        </span>
                      </>
                    ) : (
                      <span className="donation-count">{donor.donationCount} 次</span>
                    )}
                  </td>
                  <td>
                    {rankingType === 'amount' ? (
                      <span className="donation-count">{donor.donationCount} 次</span>
                    ) : (
                      <>
                        <span className="eth-amount">{donor.totalAmount.toFixed(4)} ETH</span>
                        <span className="usd-value">
                          {loadingUsd ? (
                            <span className="loading-inline">計算中...</span>
                          ) : (
                            <>
                              ({donor.usdAmount ? formatUsd(donor.usdAmount) : 'N/A'})
                              {donor.usdError && <span className="error-badge">估計</span>}
                            </>
                          )}
                        </span>
                      </>
                    )}
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

export default DonationRanking; 