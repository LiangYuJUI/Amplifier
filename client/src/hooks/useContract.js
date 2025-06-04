import { useState, useCallback } from 'react';
import { fromWei, toWei } from '../utils/web3Utils';

export const useContract = (contract, web3, accounts) => {
  const [loading, setLoading] = useState({
    projects: false,
    donations: false,
    expenses: false,
    transaction: false
  });
  const [error, setError] = useState('');

  const setLoadingState = useCallback((key, value) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleError = useCallback((error, context = '') => {
    console.error(`Error ${context}:`, error);
    const message = error.message || error.toString();
    setError(`${context}: ${message}`);
    throw error;
  }, []);

  const createProject = useCallback(async (name, description, beneficiary, goal) => {
    if (!contract || !accounts[0]) throw new Error('Wallet not connected');
    
    try {
      setLoadingState('transaction', true);
      setError('');
      
      const goalInWei = toWei(goal.toString());
      const result = await contract.methods
        .createProject(name, description, beneficiary, goalInWei)
        .send({ from: accounts[0] });
      
      return result;
    } catch (error) {
      handleError(error, 'creating project');
    } finally {
      setLoadingState('transaction', false);
    }
  }, [contract, accounts, setLoadingState, handleError]);

  const donate = useCallback(async (projectId, amount, message = '') => {
    if (!contract || !accounts[0]) throw new Error('Wallet not connected');
    
    try {
      setLoadingState('transaction', true);
      setError('');
      
      const amountInWei = toWei(amount.toString());
      const result = await contract.methods
        .donate(projectId, message)
        .send({ 
          from: accounts[0], 
          value: amountInWei 
        });
      
      return result;
    } catch (error) {
      handleError(error, 'making donation');
    } finally {
      setLoadingState('transaction', false);
    }
  }, [contract, accounts, setLoadingState, handleError]);

  const withdrawFunds = useCallback(async (projectId, amount) => {
    if (!contract || !accounts[0]) throw new Error('Wallet not connected');
    
    try {
      setLoadingState('transaction', true);
      setError('');
      
      const amountInWei = toWei(amount.toString());
      const result = await contract.methods
        .withdrawFunds(projectId, amountInWei)
        .send({ from: accounts[0] });
      
      return result;
    } catch (error) {
      handleError(error, 'withdrawing funds');
    } finally {
      setLoadingState('transaction', false);
    }
  }, [contract, accounts, setLoadingState, handleError]);

  const recordExpense = useCallback(async (projectId, description, amount, recipient) => {
    if (!contract || !accounts[0]) throw new Error('Wallet not connected');
    
    try {
      setLoadingState('transaction', true);
      setError('');
      
      const amountInWei = toWei(amount.toString());
      const result = await contract.methods
        .recordExpense(projectId, description, amountInWei, recipient)
        .send({ from: accounts[0] });
      
      return result;
    } catch (error) {
      handleError(error, 'recording expense');
    } finally {
      setLoadingState('transaction', false);
    }
  }, [contract, accounts, setLoadingState, handleError]);

  const getProjects = useCallback(async () => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      setLoadingState('projects', true);
      setError('');
      
      const projectCount = await contract.methods.projectCount().call();
      const projects = [];
      
      for (let i = 0; i < projectCount; i++) {
        const project = await contract.methods.projects(i).call();
        const availableBalance = await contract.methods.getAvailableBalance(i).call();
        const withdrawnAmount = await contract.methods.getWithdrawnAmount(i).call();
        
        projects.push({
          id: i,
          name: project.name,
          description: project.description,
          beneficiary: project.beneficiary,
          fundraisingGoal: fromWei(project.fundraisingGoal),
          totalDonated: fromWei(project.totalDonated),
          availableBalance: fromWei(availableBalance),
          withdrawnAmount: fromWei(withdrawnAmount),
          isActive: project.isActive,
          createdAt: new Date(parseInt(project.createdAt) * 1000)
        });
      }
      
      return projects;
    } catch (error) {
      handleError(error, 'fetching projects');
      return [];
    } finally {
      setLoadingState('projects', false);
    }
  }, [contract, setLoadingState, handleError]);

  const getDonations = useCallback(async (projectId) => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      setLoadingState('donations', true);
      setError('');
      
      const donationCount = await contract.methods.getDonationCount(projectId).call();
      const donations = [];
      
      for (let i = 0; i < donationCount; i++) {
        const donation = await contract.methods.donations(projectId, i).call();
        donations.push({
          donor: donation.donor,
          amount: fromWei(donation.amount),
          timestamp: new Date(parseInt(donation.timestamp) * 1000),
          message: donation.message
        });
      }
      
      return donations;
    } catch (error) {
      handleError(error, 'fetching donations');
      return [];
    } finally {
      setLoadingState('donations', false);
    }
  }, [contract, setLoadingState, handleError]);

  const getExpenses = useCallback(async (projectId) => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      setLoadingState('expenses', true);
      setError('');
      
      const expenseCount = await contract.methods.getExpenseCount(projectId).call();
      const expenses = [];
      
      for (let i = 0; i < expenseCount; i++) {
        const expense = await contract.methods.expenses(projectId, i).call();
        expenses.push({
          description: expense.description,
          amount: fromWei(expense.amount),
          timestamp: new Date(parseInt(expense.timestamp) * 1000),
          recipient: expense.recipient
        });
      }
      
      return expenses;
    } catch (error) {
      handleError(error, 'fetching expenses');
      return [];
    } finally {
      setLoadingState('expenses', false);
    }
  }, [contract, setLoadingState, handleError]);

  return {
    loading,
    error,
    setError,
    createProject,
    donate,
    withdrawFunds,
    recordExpense,
    getProjects,
    getDonations,
    getExpenses
  };
};

