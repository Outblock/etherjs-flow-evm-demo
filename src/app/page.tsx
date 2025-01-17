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
  const [providers, setProviders] = useState({} as any);
  const [flowWalletProvider, setFlowWalletProvider] = useState(null)

  const checkIfWalletIsInstalled = () => {
    //@ts-ignore
    // if (typeof window.ethereum === 'undefined') {
    //   setError('please install metamask');
    //   return false;
    // }
    return true;
  };

  const setupEventListeners = () => {
    // 监听钱包公告事件
    window.addEventListener(
      'eip6963:announceProvider',
      ((event: CustomEvent) => {
        const { info, provider } = event.detail;
        console.log('Wallet announced:', info.name);
        providers[info.rdns] = { info, provider };
        setProviders(providers)
        if (info.rdns == 'com.flowfoundation.wallet') {
          setFlowWalletProvider(provider)
        }

      }) as EventListener
    );
  }

  useEffect(() => {
    setupEventListeners()
  }, [])


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



  // connect wallet
  const connectWallet = async () => {
    try {
      if (!checkIfWalletIsInstalled()) return;
      //@ts-ignore
      const accounts = await flowWalletProvider.request({
        method: 'eth_requestAccounts'
      });

      //@ts-ignore
      const provider = new ethers.BrowserProvider(flowWalletProvider);
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




  // send transaction
  const sendTransaction = async (to: string, value: string) => {
    try {
      //@ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = {
        to: to,
        value: ethers.parseEther(value)
      };

      const transaction = await signer.sendTransaction(tx);
      await transaction.wait();

      // update balance
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));

    } catch (err: any) {
      setError('Send transaction failed:' + err.message);
    }
  };


  const getSigner = async () => {
    //@ts-ignore
    if (window.ethereum) {
      //@ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      return provider.getSigner();
    }
    throw new Error('No web3 provider found');
  }


  const signMessage = async (message: string) => {
    try {
      const signer = await getSigner();

      // sign message
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