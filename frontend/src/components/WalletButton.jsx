import { useState } from 'react';

function shorten(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Wallet cluster: connect, full address with copy, network dot, disconnect.
export default function WalletButton({ wallet }) {
  const { address, connecting, error, onChain, connect, disconnect } = wallet;
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard may be blocked */
    }
  };

  if (!address) {
    return (
      <div className="wallet">
        <button type="button" className="btn btn--ghost" onClick={connect} disabled={connecting}>
          {connecting ? 'Connecting...' : 'Connect wallet'}
        </button>
        {error && <p className="wallet__error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="wallet wallet--connected">
      <span
        className={`net-dot ${onChain ? 'net-dot--ok' : 'net-dot--warn'}`}
        title={onChain ? 'Bradbury 4221' : 'Wrong network'}
      />
      <button
        type="button"
        className="wallet__addr"
        onClick={() => setShowFull((s) => !s)}
        title="Show full address"
      >
        {showFull ? address : shorten(address)}
      </button>
      <button type="button" className="wallet__copy" onClick={copy} title="Copy address">
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button type="button" className="wallet__disc" onClick={disconnect} title="Disconnect">
        Disconnect
      </button>
    </div>
  );
}
