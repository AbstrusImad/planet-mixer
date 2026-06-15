import { useCallback, useEffect, useState } from 'react';
import {
  CONTRACT_ADDRESS,
  DEPLOY_TX,
  EXPLORER,
  fetchPlanets,
  fetchStats,
  fuse,
  isLive,
} from '../genlayer/genlayerClient.js';
import { useWallet } from '../hooks/useWallet.js';
import { useTransaction } from '../hooks/useTransaction.js';
import WalletButton from './WalletButton.jsx';
import { RARITIES } from '../data/planets.js';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

// Maps live tx phase + status onto the four staged consensus steps.
function ConsensusTheater({ tx, onClose }) {
  const { phase, liveStatus, error, hash } = tx.state;
  const steps = [
    { key: 'submit', label: 'Submitting to the galaxy' },
    { key: 'oracle', label: 'The Fusion Oracle drafts the world' },
    { key: 'agree', label: 'Validators agree on the truth' },
    { key: 'sealed', label: 'Discovery sealed on chain' },
  ];

  let active = 0;
  if (phase === 'wallet') active = 0;
  else if (phase === 'submitted') active = 1;
  else if (phase === 'consensus') {
    active = ['ACCEPTED', 'FINALIZED'].includes(liveStatus) ? 3 : 2;
  } else if (phase === 'confirmed') active = 4;

  // LEADER_TIMEOUT is shown as the oracle still working, never an error.
  const oracleConsults =
    liveStatus === 'LEADER_TIMEOUT' || liveStatus === 'VALIDATORS_TIMEOUT';

  return (
    <div className="theater" role="dialog" aria-label="GenLayer consensus">
      <div className="theater__card">
        <h3 className="theater__title">Registering on GenLayer</h3>
        <ol className="theater__steps">
          {steps.map((s, i) => (
            <li
              key={s.key}
              className={`theater__step ${i < active ? 'done' : ''} ${
                i === active ? 'active' : ''
              }`}
            >
              <span className="theater__dot" />
              {s.label}
            </li>
          ))}
        </ol>
        {oracleConsults && (
          <p className="theater__note">The oracle consults the stars, this can take a few minutes.</p>
        )}
        {phase === 'consensus' && !oracleConsults && (
          <p className="theater__note">Live status: {liveStatus}</p>
        )}
        {phase === 'confirmed' && (
          <p className="theater__ok">Sealed. Your world is now canon in the Galaxy Codex.</p>
        )}
        {phase === 'error' && <p className="theater__err">{error}</p>}
        {hash && (
          <a
            className="theater__link"
            href={`${EXPLORER}/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
          >
            View transaction
          </a>
        )}
        {(phase === 'confirmed' || phase === 'error') && (
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default function GalaxyCodex({ selected }) {
  const live = isLive();
  const wallet = useWallet();
  const tx = useTransaction();
  const [codex, setCodex] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [theaterOpen, setTheaterOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!live) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [s, planets] = await Promise.all([fetchStats(), fetchPlanets(0)]);
      setStats(s);
      setCodex(planets);
    } catch {
      setLoadError('Could not reach the Galaxy Codex. The network may be busy.');
    } finally {
      setLoading(false);
    }
  }, [live]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const configured = CONTRACT_ADDRESS && CONTRACT_ADDRESS !== ZERO_ADDR;

  const register = async () => {
    if (!selected || !wallet.address) return;
    const parentA = selected.parentA || (selected.elements && selected.elements[0]) || 'World A';
    const parentB = selected.parentB || (selected.elements && selected.elements[1]) || 'World B';
    setTheaterOpen(true);
    await tx.run({
      account: wallet.address,
      send: (client) => fuse(client, String(parentA).slice(0, 40), String(parentB).slice(0, 40)),
      onConfirmed: () => refresh(),
    });
  };

  // ---- MOCK MODE (default) ---------------------------------------------
  if (!live) {
    return (
      <section className="codex" id="codex">
        <h2 className="section-title">Galaxy Codex</h2>
        <div className="codex__explain">
          <p>
            You are playing in instant mode: fusions resolve locally so you can mix freely with no
            wallet and no waiting.
          </p>
          <p>
            Planet Mixer also has a real on chain mode. When GenLayer mode is enabled, an AI Fusion
            Oracle mints the canonical version of each discovery under validator consensus, and the
            Galaxy Codex becomes a shared, permanent record of every world found by every player.
          </p>
          <p className="codex__muted">
            The deployed Intelligent Contract lives at <code>contracts/contract.py</code>. Set
            <code> useMockGenLayer = false</code> in <code>genlayerClient.js</code> to register your
            discoveries on Bradbury.
          </p>
        </div>
      </section>
    );
  }

  // ---- LIVE MODE --------------------------------------------------------
  return (
    <section className="codex" id="codex">
      <div className="codex__head">
        <h2 className="section-title">Galaxy Codex</h2>
        <WalletButton wallet={wallet} />
      </div>

      {!configured && (
        <p className="codex__warn">
          The contract address is not set yet. Discoveries cannot be registered until it is deployed.
        </p>
      )}

      {stats && (
        <p className="codex__stats">
          <strong>{stats.discoveries}</strong> worlds canonized,{' '}
          <strong>{stats.fusions}</strong> fusions on chain
        </p>
      )}

      <div className="codex__register">
        {selected ? (
          <>
            <p>
              Register <strong>{selected.name}</strong> on GenLayer. The oracle will mint its
              canonical rarity, power and lore under validator consensus (1 to 5 minutes).
            </p>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!wallet.address || !configured || tx.state.phase === 'consensus'}
              onClick={register}
            >
              Register on GenLayer
            </button>
            {!wallet.address && <span className="codex__hint">Connect a wallet first.</span>}
          </>
        ) : (
          <p className="codex__hint">Select a discovered world to register it on chain.</p>
        )}
      </div>

      <div className="codex__list">
        <div className="codex__list-head">
          <h3>On chain discoveries</h3>
          <button type="button" className="btn btn--ghost btn--sm" onClick={refresh} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {loadError && <p className="codex__warn">{loadError}</p>}
        {codex.length === 0 && !loading && !loadError && (
          <p className="codex__hint">No worlds canonized yet. Be the first to register one.</p>
        )}
        <ul className="codex__rows">
          {codex.map((p) => {
            const rarity = RARITIES[capitalize(p.rarity)] ?? RARITIES.Common;
            return (
              <li key={p.key} className="codex__row">
                <span className="codex__row-rarity" style={{ background: rarity.frame }}>
                  {capitalize(p.rarity)}
                </span>
                <span className="codex__row-name">{p.name}</span>
                <span className="codex__row-power">PWR {p.power}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {DEPLOY_TX && DEPLOY_TX !== ZERO_ADDR.padEnd(66, '0') && (
        <a className="codex__deploy" href={`${EXPLORER}/tx/${DEPLOY_TX}`} target="_blank" rel="noreferrer">
          View the deployment
        </a>
      )}

      {theaterOpen && <ConsensusTheater tx={tx} onClose={() => {
        setTheaterOpen(false);
        tx.reset();
      }} />}
    </section>
  );
}

function capitalize(s) {
  const t = String(s || '').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
