import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import CharityDonationContract from '../contracts/CharityDonation.json';

export const useWeb3 = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [networkId, setNetworkId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        setError('');
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize Web3
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        // Get accounts
        const userAccounts = await web3Instance.eth.getAccounts();
        setAccounts(userAccounts);
        
        // Get network ID
        const netId = await web3Instance.eth.net.getId();
        setNetworkId(netId);
        
        // Initialize contract
        const deployedNetwork = CharityDonationContract.networks[netId];
        if (deployedNetwork) {
          const contractInstance = new web3Instance.eth.Contract(
            CharityDonationContract.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);
          setIsConnected(true);
        } else {
          throw new Error(`Contract not deployed on network ${netId}`);
        }
      } catch (err) {
        console.error('Error connecting to wallet:', err);
        setError(err.message || 'Failed to connect wallet');
      } finally {
        setLoading(false);
      }
    } else {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWeb3(null);
    setAccounts([]);
    setContract(null);
    setNetworkId(null);
    setIsConnected(false);
    setError('');
  }, []);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet();
        } else {
          setAccounts(newAccounts);
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [disconnectWallet]);

  return {
    web3,
    accounts,
    contract,
    networkId,
    isConnected,
    error,
    loading,
    connectWallet,
    disconnectWallet
  };
};

