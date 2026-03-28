// Game Store - localStorage persistence layer

const STORAGE_KEYS = {
  SEEDS: 'minepath_seeds',
  UNLOCKED_SKINS: 'minepath_unlocked_skins',
  UNLOCKED_TILES: 'minepath_unlocked_tiles',
  UNLOCKED_TRAILS: 'minepath_unlocked_trails',
  EQUIPPED_SKIN: 'minepath_equipped_skin',
  EQUIPPED_TILE: 'minepath_equipped_tile',
  EQUIPPED_TRAIL: 'minepath_equipped_trail',
  BEST_LEVEL: 'minepath_best_level',
  LEADERBOARD: 'minepath_leaderboard',
};

function safeGet(key, defaultVal) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultVal;
    return JSON.parse(val);
  } catch {
    return defaultVal;
  }
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const gameStore = {
  getSeeds() {
    return safeGet(STORAGE_KEYS.SEEDS, 0);
  },
  setSeeds(amount) {
    safeSet(STORAGE_KEYS.SEEDS, amount);
  },
  addSeeds(amount) {
    const current = this.getSeeds();
    safeSet(STORAGE_KEYS.SEEDS, current + amount);
    return current + amount;
  },
  spendSeeds(amount) {
    const current = this.getSeeds();
    if (current < amount) return false;
    safeSet(STORAGE_KEYS.SEEDS, current - amount);
    return true;
  },

  getUnlockedSkins() {
    return safeGet(STORAGE_KEYS.UNLOCKED_SKINS, ['classic']);
  },
  unlockSkin(id) {
    const unlocked = this.getUnlockedSkins();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      safeSet(STORAGE_KEYS.UNLOCKED_SKINS, unlocked);
    }
  },

  getUnlockedTiles() {
    return safeGet(STORAGE_KEYS.UNLOCKED_TILES, ['classic']);
  },
  unlockTile(id) {
    const unlocked = this.getUnlockedTiles();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      safeSet(STORAGE_KEYS.UNLOCKED_TILES, unlocked);
    }
  },

  getUnlockedTrails() {
    return safeGet(STORAGE_KEYS.UNLOCKED_TRAILS, ['none']);
  },
  unlockTrail(id) {
    const unlocked = this.getUnlockedTrails();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      safeSet(STORAGE_KEYS.UNLOCKED_TRAILS, unlocked);
    }
  },

  getEquippedSkin() {
    return safeGet(STORAGE_KEYS.EQUIPPED_SKIN, 'classic');
  },
  setEquippedSkin(id) {
    safeSet(STORAGE_KEYS.EQUIPPED_SKIN, id);
  },

  getEquippedTile() {
    return safeGet(STORAGE_KEYS.EQUIPPED_TILE, 'classic');
  },
  setEquippedTile(id) {
    safeSet(STORAGE_KEYS.EQUIPPED_TILE, id);
  },

  getEquippedTrail() {
    return safeGet(STORAGE_KEYS.EQUIPPED_TRAIL, 'none');
  },
  setEquippedTrail(id) {
    safeSet(STORAGE_KEYS.EQUIPPED_TRAIL, id);
  },

  getBestLevel() {
    return safeGet(STORAGE_KEYS.BEST_LEVEL, 0);
  },
  updateBestLevel(level) {
    const best = this.getBestLevel();
    if (level > best) {
      safeSet(STORAGE_KEYS.BEST_LEVEL, level);
    }
  },

  getLeaderboard() {
    return safeGet(STORAGE_KEYS.LEADERBOARD, []);
  },
  addLeaderboardEntry(entry) {
    const board = this.getLeaderboard();
    board.push({ ...entry, date: new Date().toLocaleDateString() });
    board.sort((a, b) => b.level - a.level);
    const top10 = board.slice(0, 10);
    safeSet(STORAGE_KEYS.LEADERBOARD, top10);
    return top10;
  },
};
