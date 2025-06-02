import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import CharityDonationContract from './contracts/CharityDonation.json';
import './App.css';

// 組件
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import ProjectForm from './components/ProjectForm';
import DonationForm from './components/DonationForm';
import ProjectDetails from './components/ProjectDetails';
import AdminPanel from './components/AdminPanel';
import ExchangeRateDisplay from './components/ExchangeRateDisplay';

function App() {
  // 狀態變量
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [view, setView] = useState('list'); // 'list', 'create', 'details', 'donate', 'admin'
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // 連接錢包函數
  const connectWallet = async () => {
    try {
      setLoading(true);
      console.log("開始連接錢包...");
      
      if (!window.ethereum) {
        console.error("未檢測到 MetaMask");
        alert('請安裝 MetaMask 擴展以使用此應用');
        setLoading(false);
        return;
      }
      
      console.log("檢測到 MetaMask，請求賬戶訪問權限...");
      
      // 增加延遲，避免MetaMask的circuit breaker錯誤
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // 請求用戶授權
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
          console.error("未獲得賬戶授權");
          alert('請授權訪問您的 MetaMask 賬戶');
          setLoading(false);
          return;
        }
        
        console.log("成功獲取賬戶:", accounts[0]);
        
        // 增加延遲，讓MetaMask有時間處理請求
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用HTTP提供者而不是MetaMask提供者
        const httpProvider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        const web3Instance = new Web3(httpProvider);
        
        // 檢查連接
        try {
          const isConnected = await web3Instance.eth.net.isListening();
          console.log("本地區塊鏈連接狀態:", isConnected);
          
          if (!isConnected) {
            console.error("無法連接到本地區塊鏈");
            alert('無法連接到本地Ganache區塊鏈，請確保Ganache已啟動');
            setLoading(false);
            return;
          }
          
          // 獲取網絡ID
          const networkId = await web3Instance.eth.net.getId();
          console.log("本地區塊鏈網絡ID:", networkId);
          
          // 獲取合約實例
          let contractInstance;
          let contractAddress;
          
          // 檢查合約JSON是否正確加載
          console.log("檢查合約JSON...");
          if (!CharityDonationContract || !CharityDonationContract.abi) {
            console.error("合約JSON未正確加載");
            alert('合約定義文件未正確加載，請確保合約已部署');
            setLoading(false);
            return;
          }
          
          console.log("合約網絡配置:", CharityDonationContract.networks);
          
          // 嘗試從合約網絡配置中獲取地址
          const deployedNetwork = CharityDonationContract.networks["1337"];
          
          // 如果沒有找到1337網絡的部署
          if (!deployedNetwork) {
            console.warn("合約未部署到網路ID 1337");
            
            // 獲取合約中的所有可用網路
            const availableNetworks = Object.keys(CharityDonationContract.networks);
            console.log("可用網路:", availableNetworks);
            
            if (availableNetworks.length > 0) {
              const firstNetworkId = availableNetworks[0];
              console.log(`嘗試使用網路ID: ${firstNetworkId} 的合約地址`);
              
              contractAddress = CharityDonationContract.networks[firstNetworkId].address;
              console.log("使用合約地址:", contractAddress);
            } else {
              console.error("無可用網路");
              alert('合約未部署到任何網絡，請確保您已部署合約');
              setLoading(false);
              return;
            }
          } else {
            console.log("在網絡ID 1337 找到合約:", deployedNetwork.address);
            contractAddress = deployedNetwork.address;
          }
          
          // 確保我們有合約地址
          if (!contractAddress) {
            console.error("無法獲取合約地址");
            alert('無法獲取合約地址，請確保合約已正確部署');
            setLoading(false);
            return;
          }
          
          // 創建合約實例
          try {
            console.log("創建合約實例，使用地址:", contractAddress);
            console.log("ABI長度:", CharityDonationContract.abi.length);
            
            contractInstance = new web3Instance.eth.Contract(
              CharityDonationContract.abi,
              contractAddress
            );
            
            console.log("成功創建合約實例");
          } catch (contractError) {
            console.error("創建合約實例失敗:", contractError);
            alert('無法連接到智能合約，請確保您連接到正確的網絡');
            setLoading(false);
            return;
          }
          
          // 檢查合約實例是否有效
          if (!contractInstance || !contractInstance.methods) {
            console.error("合約實例無效");
            alert('合約實例無效，請重新部署合約');
            setLoading(false);
            return;
          }
          
          // 檢查當前用戶是否是合約擁有者
          let owner;
          try {
            console.log("嘗試調用合約的owner方法...");
            owner = await contractInstance.methods.owner().call();
            console.log("合約擁有者:", owner);
          } catch (ownerError) {
            console.error("獲取合約擁有者失敗:", ownerError);
            console.error("錯誤詳情:", JSON.stringify(ownerError));
            alert('無法獲取合約信息，請確保合約已正確部署並且您連接到正確的網絡');
            setLoading(false);
            return;
          }
          
          const isCurrentUserOwner = accounts[0].toLowerCase() === owner.toLowerCase();
          console.log("當前用戶是否為擁有者:", isCurrentUserOwner);
          
          setWeb3(web3Instance);
          setAccounts(accounts);
          setContract(contractInstance);
          setIsOwner(isCurrentUserOwner);
          setIsWalletConnected(true);
          
          // 監聽MetaMask賬戶變化
          window.ethereum.on('accountsChanged', (newAccounts) => {
            console.log("賬戶已變更:", newAccounts);
            setAccounts(newAccounts);
            if (newAccounts.length === 0) {
              // 用戶斷開了連接
              setIsWalletConnected(false);
            } else {
              setIsOwner(newAccounts[0].toLowerCase() === owner.toLowerCase());
            }
          });
          
          try {
            await loadProjects(contractInstance, web3Instance);
            console.log("項目加載成功");
          } catch (loadError) {
            console.error("加載項目失敗:", loadError);
            console.error("錯誤詳情:", JSON.stringify(loadError));
          }
          
          console.log("錢包連接成功");
        } catch (error) {
          console.error("連接本地區塊鏈錯誤:", error);
          alert('無法連接到本地區塊鏈，請確保Ganache已啟動並運行在8545端口');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("連接錢包錯誤:", error);
        console.error("錯誤詳情:", JSON.stringify(error));
        
        // 更詳細的錯誤處理
        if (error.code === 4001) {
          // 用戶拒絕了請求
          alert('您拒絕了連接請求，請允許 MetaMask 連接以使用此應用');
        } else if (error.code === -32002) {
          // 已經有一個待處理的請求
          alert('已有一個待處理的 MetaMask 請求，請在 MetaMask 中確認');
        } else {
          // 其他錯誤
          alert('連接錢包時出錯: ' + (error.message || '未知錯誤'));
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("連接錢包錯誤:", error);
      console.error("錯誤詳情:", JSON.stringify(error));
      
      // 更詳細的錯誤處理
      if (error.code === 4001) {
        // 用戶拒絕了請求
        alert('您拒絕了連接請求，請允許 MetaMask 連接以使用此應用');
      } else if (error.code === -32002) {
        // 已經有一個待處理的請求
        alert('已有一個待處理的 MetaMask 請求，請在 MetaMask 中確認');
      } else {
        // 其他錯誤
        alert('連接錢包時出錯: ' + (error.message || '未知錯誤'));
      }
    }
  };

  // 切換錢包函數
  const switchWallet = async () => {
    try {
      setLoading(true);
      console.log("嘗試切換錢包...");
      
      if (!window.ethereum) {
        console.error("未檢測到 MetaMask");
        alert('請安裝 MetaMask 擴展以使用此應用');
        setLoading(false);
        return;
      }
      
      // 請求MetaMask打開錢包選擇界面
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      // 重新連接錢包以獲取新選擇的賬戶
      await connectWallet();
      
    } catch (error) {
      console.error("切換錢包錯誤:", error);
      if (error.code === 4001) {
        alert('您取消了切換錢包操作');
      } else {
        alert('切換錢包時出錯: ' + (error.message || '未知錯誤'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 初始化Web3和智能合約
  useEffect(() => {
    const init = async () => {
      try {
        console.log("初始化應用...");
        // 檢查是否有MetaMask
        if (window.ethereum) {
          console.log("檢測到 MetaMask");
          
          // 重置MetaMask連接狀態
          try {
            // 等待一段時間，確保MetaMask已完全加載
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const web3Instance = new Web3(window.ethereum);
            
            // 檢查是否已授權
            try {
              const accounts = await web3Instance.eth.getAccounts();
              console.log("檢查現有賬戶:", accounts);
              
              if (accounts && accounts.length > 0) {
                console.log("發現已授權賬戶，嘗試自動連接");
                
                // 使用重試機制
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                  try {
                    // 用戶已經授權，直接連接
                    await connectWallet();
                    break; // 如果成功，跳出循環
                  } catch (retryError) {
                    console.log(`連接嘗試 ${retryCount + 1} 失敗:`, retryError);
                    retryCount++;
                    
                    if (retryCount >= maxRetries) {
                      console.error("多次嘗試後仍無法連接錢包");
                      alert("連接錢包失敗，請嘗試手動連接或重新載入頁面");
                      setLoading(false);
                      break;
                    }
                    
                    // 等待一段時間再重試
                    await new Promise(resolve => setTimeout(resolve, 1500));
                  }
                }
              } else {
                console.log("未找到已授權賬戶，等待手動連接");
                // 用戶未授權，等待手動連接
                setLoading(false);
              }
            } catch (accountError) {
              console.error("檢查賬戶時出錯:", accountError);
              setLoading(false);
            }
          } catch (initError) {
            console.error("初始化MetaMask時出錯:", initError);
            setLoading(false);
          }
        } else {
          console.warn("未檢測到 MetaMask");
          alert('請安裝MetaMask以使用此應用');
          setLoading(false);
        }
      } catch (error) {
        console.error("初始化錯誤:", error);
        setLoading(false);
      }
    };
    
    init();
  }, []);
  
  // 加載所有慈善項目
  const loadProjects = async (contractInstance, web3Instance) => {
    try {
      const contract = contractInstance || window.contract;
      if (!contract) return;
      
      // 使用傳入的web3實例或全局web3
      const web3Util = web3Instance || web3;
      if (!web3Util) {
        console.error("Web3實例不可用，無法加載項目");
        return;
      }
      
      const projectCount = await contract.methods.projectCount().call();
      const projectsArray = [];
      
      // projectCount 也是 BigInt，需要轉換
      const count = Number(projectCount); 

      for (let i = 0; i < count; i++) {
        const project = await contract.methods.projects(i).call();
        
        // 處理金額格式化 - 確保數值正確
        const fundraisingGoalWei = project.fundraisingGoal.toString();
        const totalDonatedWei = project.totalDonated.toString();
        
        projectsArray.push({
          id: i,
          name: project.name,
          description: project.description,
          beneficiary: project.beneficiary,
          // 存儲原始wei值，在顯示時再進行格式化
          fundraisingGoal: fundraisingGoalWei,
          totalDonated: totalDonatedWei,
          isActive: project.isActive,
          // 將 project.createdAt (BigInt) 轉換為 Number 再進行計算
          createdAt: new Date(Number(project.createdAt) * 1000).toLocaleString()
        });
      }
      
      setProjects(projectsArray);
    } catch (error) {
      console.error("加載項目錯誤:", error);
    }
  };
  
  // 創建新的慈善項目
  const createProject = async (name, description, beneficiary, fundraisingGoal) => {
    try {
      setLoading(true);
      // 嘗試增加 gas limit
      const gasLimit = 3000000; // 可以根據需要調整這個值
      console.log(`Attempting to create project with gas limit: ${gasLimit}`);
      await contract.methods.createProject(
        name,
        description,
        beneficiary,
        web3.utils.toWei(fundraisingGoal.toString(), 'ether')
      ).send({ from: accounts[0], gas: gasLimit });
      
      await loadProjects(contract, web3);
      setView('list');
    } catch (error) {
      console.error("創建項目錯誤:", error);
      // 更詳細的錯誤輸出
      if (error.receipt) {
        console.error("交易回執:", error.receipt);
      }
      alert('創建項目失敗，請檢查瀏覽器控制台和Ganache日誌獲取更多信息。');
    } finally {
      setLoading(false);
    }
  };
  
  // 捐款給指定項目
  const donateToProject = async (projectId, amount, message) => {
    try {
      setLoading(true);
      console.log(`開始捐款，項目ID: ${projectId}，金額: ${amount} ETH，留言: ${message}`);
      
      // 確保contract和web3已正確初始化
      if (!contract || !contract.methods) {
        console.error("合約實例不可用");
        alert('合約連接錯誤，請重新連接錢包後再試');
        setLoading(false);
        return;
      }
      
      if (!web3 || !web3.utils) {
        console.error("Web3實例不可用");
        alert('Web3連接錯誤，請重新連接錢包後再試');
        setLoading(false);
        return;
      }
      
      // 確保賬戶已連接
      if (!accounts || accounts.length === 0) {
        console.error("未找到已連接的賬戶");
        alert('請先連接MetaMask錢包');
        setLoading(false);
        return;
      }
      
      // 確保金額有效
      if (isNaN(amount) || amount <= 0) {
        console.error("無效的捐款金額:", amount);
        alert('請輸入有效的捐款金額');
        setLoading(false);
        return;
      }
      
      // 轉換為wei
      const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
      console.log(`捐款金額(wei): ${amountInWei}`);
      
      // 設置交易參數
      const gasLimit = 3000000; // 設置足夠高的gas限制
      const transactionParameters = {
        from: accounts[0],
        value: amountInWei,
        gas: gasLimit
      };
      
      console.log("交易參數:", transactionParameters);
      console.log("調用合約donate方法...");
      
      // 執行捐款交易
      const result = await contract.methods.donate(projectId, message || "").send(transactionParameters);
      
      console.log("捐款交易成功:", result);
      
      // 重新加載項目列表
      await loadProjects(contract, web3);
      setView('details');
      
      // 顯示成功消息
      alert('捐款成功！感謝您的慷慨支持');
    } catch (error) {
      console.error("捐款錯誤:", error);
      
      // 詳細的錯誤處理
      if (error.code === 4001) {
        alert('您取消了交易');
      } else if (error.message && error.message.includes("gas")) {
        alert('交易失敗：可能是Gas不足。請嘗試增加Gas限制或減少捐款金額');
      } else if (error.message && error.message.includes("balance")) {
        alert('交易失敗：餘額不足。請確保您的錢包中有足夠的ETH');
      } else if (error.message && error.message.includes("reverted")) {
        alert('交易被回滾：合約執行失敗。項目可能已關閉或不存在');
      } else {
        alert('捐款失敗：' + (error.message || '未知錯誤'));
      }
      
      // 如果有交易回執，記錄它
      if (error.receipt) {
        console.error("交易回執:", error.receipt);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // 切換項目狀態（僅限所有者）
  const toggleProjectStatus = async (projectId) => {
    try {
      setLoading(true);
      await contract.methods.toggleProjectStatus(projectId).send({ from: accounts[0] });
      await loadProjects(contract, web3);
    } catch (error) {
      console.error("切換項目狀態錯誤:", error);
      alert('切換項目狀態失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 提取資金（僅限受益人）
  const withdrawFunds = async (projectId, amount) => {
    try {
      setLoading(true);
      await contract.methods.withdrawFunds(
        projectId,
        web3.utils.toWei(amount.toString(), 'ether')
      ).send({ from: accounts[0] });
      
      await loadProjects(contract, web3);
    } catch (error) {
      console.error("提取資金錯誤:", error);
      alert('提取資金失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 記錄支出（僅限受益人）
  const recordExpense = async (projectId, description, amount, recipient) => {
    try {
      setLoading(true);
      await contract.methods.recordExpense(
        projectId,
        description,
        web3.utils.toWei(amount.toString(), 'ether'),
        recipient
      ).send({ from: accounts[0] });
    } catch (error) {
      console.error("記錄支出錯誤:", error);
      alert('記錄支出失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 顯示項目詳情
  const showProjectDetails = (project) => {
    setSelectedProject(project);
    setView('details');
  };
  
  // 渲染不同視圖
  const renderView = () => {
    // 如果錢包未連接，顯示連接錢包按鈕
    if (!isWalletConnected) {
      return (
        <div className="wallet-connect-container">
          <h2>歡迎使用區塊鏈透明慈善捐贈平台</h2>
          <p>請連接您的 MetaMask 錢包以開始使用</p>
          <button className="btn btn-primary btn-lg" onClick={connectWallet}>
            <i className="fas fa-wallet"></i> 連接錢包
          </button>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>加載中，請稍候...</span>
        </div>
      );
    }
    
    switch (view) {
      case 'create':
        return <ProjectForm createProject={createProject} onCancel={() => setView('list')} />;
      case 'donate':
        return (
          <DonationForm
            project={selectedProject}
            onDonate={donateToProject}
            onCancel={() => setView('details')}
          />
        );
      case 'details':
        return (
          <ProjectDetails
            project={selectedProject}
            isOwner={isOwner}
            isBeneficiary={selectedProject && accounts[0].toLowerCase() === selectedProject.beneficiary.toLowerCase()}
            toggleStatus={toggleProjectStatus}
            withdrawFunds={withdrawFunds}
            recordExpense={recordExpense}
            onDonate={() => setView('donate')}
            onBack={() => setView('list')}
          />
        );
      case 'admin':
        if (!isOwner) {
          setView('list');
          return (
            <ProjectList
              projects={projects}
              onProjectClick={showProjectDetails}
              isOwner={isOwner}
              onCreateClick={() => setView('create')}
            />
          );
        }
        return (
          <AdminPanel
            projects={projects}
            toggleStatus={toggleProjectStatus}
            onCreateClick={() => setView('create')}
            onViewDetails={showProjectDetails}
          />
        );
      case 'list':
      default:
        return (
          <ProjectList
            projects={projects}
            onProjectClick={showProjectDetails}
            isOwner={isOwner}
            onCreateClick={() => setView('create')}
          />
        );
    }
  };
  
  return (
    <div className="App">
      <Header
        account={accounts[0]}
        isOwner={isOwner}
        isWalletConnected={isWalletConnected}
        onConnectWallet={connectWallet}
        onSwitchWallet={switchWallet}
        onAdminClick={() => setView('admin')}
      />
      <main className="container">
        {isWalletConnected && <ExchangeRateDisplay />}
        {renderView()}
      </main>
    </div>
  );
}

export default App;
