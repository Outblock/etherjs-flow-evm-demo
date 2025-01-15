"use client"
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletConnect = () => {
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [chainId, setChainId] = useState('');
  const [error, setError] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');
  // 检查是否安装了 MetaMask
  const checkIfWalletIsInstalled = () => {
    if (typeof window.ethereum === 'undefined') {
      setError('请安装 MetaMask 钱包');
      return false;
    }
    return true;
  };



  const CUSTOM_NETWORKS: any = {
    // Flow evm mainnet
    747: {
      chainId: 747,
      chainName: 'Flow EVM Mainnet',
      nativeCurrency: {
        name: 'FLOW',
        symbol: 'FLOW',
        decimals: 18
      },
      rpcUrls: ['https://mainnet.evm.nodes.onflow.org'],
      blockExplorerUrls: ['https://evm.flowscan.io/']
    },
    // Flow evm testnet
    545: {
      chainId: 545,
      chainName: 'Flow EVM Testnet',
      nativeCurrency: {
        name: 'FLOW',
        symbol: 'FLOW',
        decimals: 18
      },
      rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
      blockExplorerUrls: ['https://evm-testnet.flowscan.io']
    }
  };


  async function addCustomNetwork(networkKey: string) {
    try {
      const network = CUSTOM_NETWORKS[networkKey];
      if (!network) {
        throw new Error('未找到网络配置');
      }

      // 格式化 chainId 为十六进制
      const chainIdHex = `0x${network.chainId.toString(16)}`;

      // 先尝试切换到该网络
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        return true;
      } catch (switchError: any) {
        // 如果网络不存在（错误代码 4902），则添加网络
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls
            }]
          });
          return true;
        }
        throw switchError;
      }
    } catch (error) {
      console.error('添加网络失败：', error);
      throw error;
    }
  }

  // 连接钱包
  const connectWallet = async () => {
    try {
      if (!checkIfWalletIsInstalled()) return;

      // 请求用户连接钱包
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(accounts[0]);

      setAccount(accounts[0]);
      setChainId(network.chainId.toString());
      setBalance(ethers.formatEther(balance));
      setError('');

    } catch (err: any) {
      setError('Connect wallet failed:' + err.message);
    }
  };

  // 监听账户变化
  const listenToAccountChanges = () => {
    if (!checkIfWalletIsInstalled()) return;

    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(accounts[0]);
        setAccount(accounts[0]);
        setBalance(ethers.formatEther(balance));
      } else {
        // 用户断开了所有账户
        setAccount('');
        setBalance('');
      }
    });
  };

  // listen to chain changes
  const listenToChainChanges = () => {
    if (!checkIfWalletIsInstalled()) return;

    window.ethereum.on('chainChanged', (chainId: string) => {
      setChainId(parseInt(chainId).toString());
      // 建议在链变化时刷新页面
      window.location.reload();
    });
  };

  // switch network
  const switchNetwork = async (chainId: string) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(chainId) }],
      });
    } catch (err: any) {
      setError('Switch network failed:' + err.message);
    }
  };

  const handleNetworkChange = async (networkKey: string) => {
    try {
      setError('');
      await addCustomNetwork(networkKey);
      setSelectedNetwork(networkKey);
    } catch (err: any) {
      setError(`Switch network failed: ${err.message}`);
    }
  };

  // send transaction
  const sendTransaction = async (to: string, value: string) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = {
        to: to,
        value: ethers.parseEther(value)
      };

      const transaction = await signer.sendTransaction(tx);
      await transaction.wait();

      // 更新余额
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));

    } catch (err: any) {
      setError('Send transaction failed:' + err.message);
    }
  };

  useEffect(() => {
    listenToAccountChanges();
    listenToChainChanges();
  }, []);

  const getSigner = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider.getSigner();
    }
    throw new Error('No web3 provider found');
  }


  const signMessage = async (message: string) => {
    try {
      const signer = await getSigner();

      // 签名消息
      const signature = await signer.signMessage(message);
      setSignature(signature);
      return {
        success: true,
        signature: signature,
        message: message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!account ? (
        <button onClick={connectWallet}>连接钱包</button>
      ) : (
        <div>
          <p>Address：{account}</p>
          <p>Balance：{balance} FLOW</p>
          <p>Chain ID: {chainId}</p>

          <div>
            <button onClick={() => handleNetworkChange('747')}>Change to Flow evm mainnet</button>
            <br></br>
            <button onClick={() => handleNetworkChange('545')}>Change to Flow evm testnet</button>
          </div>
          <br />
          <div>
            <input type="text" placeholder="Enter the recipient address" onChange={e => setToAddress(e.target.value)} />
            <br />
            <button onClick={() => sendTransaction(toAddress, '0.01')}>
              send 0.01 FLOW to {toAddress}
            </button>
          </div>

          <div>
            <input type="text" placeholder="Enter the message to sign" onChange={e => setMessage(e.target.value)} />
            <br />
            <button onClick={() => signMessage(message)}>
              Sign Message
            </button>
            <br />
            <p>Signature: {JSON.stringify(signature)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;