import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

// Live PlanetMixer contract on GenLayer Bradbury Testnet.
// The parent process replaces these placeholders after deployment.
export const CONTRACT_ADDRESS = '0xa7d6D88FfAF0fEae1CB3a5d52Fd6F82E422f2383';
export const DEPLOY_TX = '0x0f4b143253902291c173d3f5e48f1806e63a29982e29667b0752fdf162d18edf';
export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';

const ADDRESS = CONTRACT_ADDRESS;

export const readClient = createClient({ chain: testnetBradbury });

export const makeWalletClient = (account) => createClient({ chain: testnetBradbury, account });

// ---- resilient reads -----------------------------------------------------

export async function withRpcRetry(fn, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|too many/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

function toRecord(value) {
  if (value instanceof Map) {
    const obj = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v);
    return obj;
  }
  return value;
}

function normalize(value) {
  if (value instanceof Map) return toRecord(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function num(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function str(v) {
  return String(v ?? '');
}

function asPlanet(raw) {
  const r = toRecord(normalize(raw));
  return {
    key: str(r.key),
    parentA: str(r.parentA),
    parentB: str(r.parentB),
    name: str(r.name),
    rarity: str(r.rarity),
    power: num(r.power),
    element: str(r.element),
    ability: str(r.ability),
    lore: str(r.lore),
    discoverer: str(r.discoverer),
    seq: num(r.seq),
  };
}

export async function fetchStats() {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_stats', args: [] }),
  );
  const r = toRecord(normalize(raw));
  return { discoveries: num(r.discoveries), fusions: num(r.fusions) };
}

export async function fetchPlanets(start = 0) {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_planets', args: [BigInt(start)] }),
  );
  const arr = normalize(raw) ?? [];
  return arr.map(asPlanet);
}

export async function fetchPlanet(key) {
  const raw = await withRpcRetry(() =>
    readClient.readContract({ address: ADDRESS, functionName: 'get_planet', args: [key] }),
  );
  const r = normalize(raw);
  if (!r || (r instanceof Object && Object.keys(toRecord(r)).length === 0)) return null;
  return asPlanet(r);
}

export async function isDiscovered(parentA, parentB) {
  return withRpcRetry(() =>
    readClient.readContract({
      address: ADDRESS,
      functionName: 'is_discovered',
      args: [parentA, parentB],
    }),
  );
}

// ---- writes --------------------------------------------------------------

export function fuse(client, parentA, parentB) {
  return client.writeContract({
    address: ADDRESS,
    functionName: 'fuse',
    args: [parentA, parentB],
    value: 0n,
  });
}

// ---- transaction polling -------------------------------------------------

const STATUS_NAME = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const statusName = (s) => STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();

// LEADER_TIMEOUT / VALIDATORS_TIMEOUT are intentionally absent: the network
// rotates the leader and retries, so keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export async function pollUntilDecided(client, hash, onUpdate) {
  for (let i = 0; i < 150; i++) {
    const tx = await client.getTransaction({ hash }).catch(() => null);
    const status = statusName(tx ? tx.status : 'PENDING');
    onUpdate?.(status);
    if (TERMINAL.has(status)) return { status };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT' };
}
