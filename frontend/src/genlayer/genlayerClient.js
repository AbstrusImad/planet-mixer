// High level GenLayer access for Planet Mixer.
//
// useMockGenLayer = true (default) keeps gameplay instant and offline friendly:
// fusions resolve locally from the curated rules + generateHybridPlanet.
//
// useMockGenLayer = false (LIVE mode) talks to the deployed PlanetMixer contract
// on GenLayer Bradbury through genlayer-js. The on chain contract is the canonical
// "Galaxy Codex" of discoveries. A live fuse() write takes 1 to 5 minutes under
// validator consensus, so it is exposed as a deliberate "Register on GenLayer"
// action, never the core play loop.

import {
  CONTRACT_ADDRESS,
  DEPLOY_TX,
  EXPLORER,
  FAUCET,
  fetchPlanet,
  fetchPlanets,
  fetchStats,
  fuse,
  isDiscovered,
  makeWalletClient,
  pollUntilDecided,
} from './contract.js';

export const useMockGenLayer = false;

export {
  CONTRACT_ADDRESS,
  DEPLOY_TX,
  EXPLORER,
  FAUCET,
  fetchPlanet,
  fetchPlanets,
  fetchStats,
  fuse,
  isDiscovered,
  makeWalletClient,
  pollUntilDecided,
};

export function isLive() {
  return !useMockGenLayer;
}
