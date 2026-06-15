import { useCallback, useEffect, useState } from 'react';

const BRADBURY_PARAMS = {
  chainId: '0x107D', // 4221
  chainName: 'GenLayer Bradbury Testnet',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  blockExplorerUrls: ['https://explorer-bradbury.genlayer.com/'],
};
const BRADBURY_CHAIN_ID = '0x107d';

function getEth() {
  if (typeof window === 'undefined') return null;
  return window.ethereum ?? null;
}

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasProvider, setHasProvider] = useState(false);

  useEffect(() => {
    setHasProvider(!!getEth());
  }, []);

  const refreshChain = useCallback(async () => {
    const eth = getEth();
    if (!eth) return;
    try {
      const id = await eth.request({ method: 'eth_chainId' });
      setChainId(id);
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      setError('No wallet detected. Install a GenLayer compatible wallet to register discoveries.');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      try {
        await eth.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_PARAMS] });
      } catch {
        /* chain may already exist */
      }
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BRADBURY_PARAMS.chainId }],
        });
      } catch {
        /* user may decline the switch */
      }
      setAddress(accounts[0]);
      await refreshChain();
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (/reject|denied|4001/i.test(msg)) setError('You cancelled the connection');
      else setError('Could not connect to the wallet');
    } finally {
      setConnecting(false);
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  useEffect(() => {
    const eth = getEth();
    if (!eth || !eth.on) return;
    const onAccounts = (accs) => {
      if (!accs || accs.length === 0) setAddress(null);
      else setAddress(accs[0]);
    };
    const onChainChanged = (id) => setChainId(id);
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChainChanged);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  const onChain = (chainId ?? '').toLowerCase() === BRADBURY_CHAIN_ID;

  return { address, chainId, connecting, error, hasProvider, onChain, connect, disconnect };
}
