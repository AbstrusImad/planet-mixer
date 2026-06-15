# GenLayer contract reference

The canonical deployed Intelligent Contract source for Planet Mixer lives at:

    ../../contracts/contract.py

(that is `planet-mixer/contracts/contract.py` from the project root).

Do not duplicate or edit that file here. This frontend only talks to the
deployed contract through `genlayer-js` using the address in `contract.js`.

Contract interface used by the frontend:

- view  `get_stats()` -> { discoveries, fusions }
- view  `get_planets(start: u256)` -> array of planet records (paged, 20 per page)
- view  `get_planet(key: str)` -> one record or {}
- view  `is_discovered(parentA: str, parentB: str)` -> bool
- write `fuse(parentA: str, parentB: str)` -> the Fusion Oracle mints the canonical
  hybrid under validator consensus (rarity, power 0-100, name, ability, lore, element).

The `fuse` write runs an AI Fusion Oracle across validators and can take 1 to 5
minutes to finalize on Bradbury, so the UI treats it as an explicit
"Register on GenLayer" step, not the instant play loop.
