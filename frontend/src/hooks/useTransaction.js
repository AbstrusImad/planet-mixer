import { useCallback, useRef, useState } from 'react';
import { makeWalletClient, pollUntilDecided } from '../genlayer/genlayerClient.js';

// Phases map onto the staged consensus screen.
// idle -> wallet -> submitted -> consensus -> confirmed | error
const INITIAL = {
  phase: 'idle',
  hash: null,
  liveStatus: '',
  error: null,
};

function friendly(e) {
  const msg = String(e?.message ?? e);
  if (/LackOfFundForMaxFee|insufficient funds/i.test(msg)) {
    return 'Your wallet is below the fee reserve for AI transactions (mostly refunded). Top up at testnet-faucet.genlayer.foundation';
  }
  if (/reject|denied|4001/i.test(msg)) return 'You cancelled the signature';
  if (/rate limit|429|too many/i.test(msg)) {
    return 'The network is congested, your discovery is still being judged';
  }
  if (/network|fetch/i.test(msg)) return 'Network error, check your connection';
  if (/timeout/i.test(msg)) return 'The network is congested, your discovery is still being judged';
  const expected = msg.match(/\[EXPECTED\]\s*(.+)/i);
  if (expected) return expected[1].trim();
  return 'The transaction failed. Please try again.';
}

export function useTransaction() {
  const [state, setState] = useState(INITIAL);
  const submitting = useRef(false);

  const reset = useCallback(() => setState(INITIAL), []);

  const run = useCallback(async ({ account, send, onConfirmed }) => {
    if (submitting.current) return;
    submitting.current = true;
    setState({ ...INITIAL, phase: 'wallet' });
    try {
      const client = makeWalletClient(account);
      const hash = await send(client);
      setState((s) => ({ ...s, phase: 'submitted', hash }));
      setState((s) => ({ ...s, phase: 'consensus', liveStatus: 'PENDING' }));

      const { status } = await pollUntilDecided(client, hash, (st) => {
        setState((s) => ({ ...s, liveStatus: st }));
      });

      if (status === 'ACCEPTED' || status === 'FINALIZED') {
        setState((s) => ({ ...s, phase: 'confirmed', liveStatus: status }));
        onConfirmed?.(status);
      } else if (status === 'UNDETERMINED') {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'The validators could not reach consensus. Please try again.',
        }));
      } else if (status === 'CANCELED') {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'The ruling was canceled on chain.',
        }));
      } else {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'The network is still processing. Check the explorer for the final ruling.',
        }));
      }
    } catch (e) {
      setState((s) => ({ ...s, phase: 'error', error: friendly(e) }));
    } finally {
      submitting.current = false;
    }
  }, []);

  return { state, run, reset };
}
