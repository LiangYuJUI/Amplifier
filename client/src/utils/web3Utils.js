import Web3 from 'web3';

/**
 * Convert Wei to Ether
 * @param {string|number} value - Value in Wei
 * @returns {string} Value in Ether
 */
export const fromWei = (value) => {
  if (!value) return '0';
  
  try {
    // 確保值是字符串，以處理大數值
    const valueStr = value.toString();
    if (valueStr === '0') return '0';
    
    // 使用Web3.utils.fromWei轉換
    const ethValue = Web3.utils.fromWei(valueStr, 'ether');
    
    // 格式化ETH金額，顯示最多4位小數
    return parseFloat(parseFloat(ethValue).toFixed(4)).toString();
  } catch (error) {
    console.error("Wei轉ETH錯誤:", error, value);
    return '0';
  }
};

/**
 * Convert Ether to Wei
 * @param {string|number} value - Value in Ether
 * @returns {string} Value in Wei
 */
export const toWei = (value) => {
  if (!value) return '0';
  
  try {
    // 確保值是字符串，以處理大數值
    const valueStr = value.toString();
    if (valueStr === '0') return '0';
    
    // 使用Web3.utils.toWei轉換
    return Web3.utils.toWei(valueStr, 'ether');
  } catch (error) {
    console.error("ETH轉Wei錯誤:", error, value);
    return '0';
  }
};

/**
 * Validate Ethereum address
 * @param {string} address - Ethereum address
 * @returns {boolean} True if valid
 */
export const isValidAddress = (address) => {
  return Web3.utils.isAddress(address);
};

/**
 * Validate amount (positive number)
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount) => {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num < 1000000;
};

/**
 * Format address for display (truncated)
 * @param {string} address - Ethereum address
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format amount for display
 * @param {string|number} amount - Amount to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, decimals = 4) => {
  if (!amount || amount === '0') return '0';
  const num = parseFloat(amount);
  return num.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Get gas estimate for transaction
 * @param {object} contract - Contract instance
 * @param {string} method - Method name
 * @param {array} params - Method parameters
 * @param {object} options - Transaction options
 * @returns {Promise<number>} Gas estimate
 */
export const estimateGas = async (contract, method, params = [], options = {}) => {
  try {
    const gasEstimate = await contract.methods[method](...params).estimateGas(options);
    // Add 20% buffer
    return Math.floor(gasEstimate * 1.2);
  } catch (error) {
    console.warn('Gas estimation failed, using default:', error);
    return 300000; // Default gas limit
  }
};

/**
 * Wait for transaction confirmation
 * @param {object} web3 - Web3 instance
 * @param {string} txHash - Transaction hash
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<object>} Transaction receipt
 */
export const waitForConfirmation = async (web3, txHash, confirmations = 1) => {
  return new Promise((resolve, reject) => {
    const checkConfirmation = async () => {
      try {
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
          const currentBlock = await web3.eth.getBlockNumber();
          const confirmationCount = currentBlock - receipt.blockNumber;
          
          if (confirmationCount >= confirmations) {
            resolve(receipt);
          } else {
            setTimeout(checkConfirmation, 1000);
          }
        } else {
          setTimeout(checkConfirmation, 1000);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    checkConfirmation();
  });
};

