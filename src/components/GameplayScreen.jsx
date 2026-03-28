import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameStore } from '../store/gameStore';
import { audio } from '../audio/engine';
import { CHICKEN_SKINS, TILE_STYLES, TRAIL_EFFECTS } from '../data/skins';

// ─── DIFFICULTY CONFIG ───────────────────────────────────────────
function getDifficultyConfig(level) {
  let mineRate, timerSpeed, obstacleFreq;
  if (level <= 5)       { mineRate = 0.20; timerSpeed = 0.8;  obstacleFreq = 0; }
  else if (level <= 10) { mineRate = 0.30; timerSpeed = 1.2;  obstacleFreq = 0.3; }
  else if (level <= 15) { mineRate = 0.40; timerSpeed = 1.8;  obstacleFreq = 0.5; }
  else if (level <= 20) { mineRate = 0.50; timerSpeed = 2.5;  obstacleFreq = 0.7; }
  else                  { mineRate = 0.60; timerSpeed = 3.5;  obstacleFreq = 1.0; }
  const rows = Math.min(6 + Math.floor(level / 4), 10);
  const cols = Math.min(6 + Math.floor(level / 6), 9);
  const timerMax = Math.max(20, 45 - level * 0.8);
  return { mineRate, timerSpeed, rows, cols, timerMax, obstacleFreq };
}

// ─── GRID GENERATION ─────────────────────────────────────────────
function generateGrid(rows, cols, mineRate, level) {
  const tiles = [];
  const checkpointR = 0, checkpointC = cols - 1;
  const startR = rows - 1, startC = 0;
  const powerupCount = Math.max(1, Math.floor(level / 3));
  const powerupTypes = ['shield', 'slowmo', 'reveal', 'doublescore'];
  const fakeSafeCount = level >= 8 ? Math.floor(level / 8) : 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push({
        r, c,
        isMine: false,
        isSafe: true,
        isCheckpoint: r === checkpointR && c === checkpointC,
        isStart: r === startR && c === startC,
        state: 'hidden', // hidden | revealed | mine | checkpoint
        powerup: null,
        isFakeSafe: false,
      });
    }
  }

  // Place mines
  const candidates = tiles.filter(t =>
    !t.isCheckpoint && !t.isStart
  );

  // Shuffle and place mines
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const mineCount = Math.floor((rows * cols - 2) * mineRate);
  let minesPlaced = 0;

  shuffled.slice(0, mineCount).forEach(t => {
    const tile = tiles.find(x => x.r === t.r && x.c === t.c);
    if (tile && !tile.isCheckpoint && !tile.isStart) {
      tile.isMine = true;
      tile.isSafe = false;
      minesPlaced++;
    }
  });

  // Place fake safe tiles (look safe but are mines)
  const safeTiles = tiles.filter(t => !t.isMine && !t.isCheckpoint && !t.isStart);
  safeTiles.slice(0, fakeSafeCount).forEach(t => {
    const tile = tiles.find(x => x.r === t.r && x.c === t.c);
    if (tile) {
      tile.isFakeSafe = true;
      tile.isMine = true;
      tile.isSafe = false;
    }
  });

  // Place powerups on safe tiles
  const safeTilesForPowerup = tiles.filter(t => !t.isMine && !t.isCheckpoint && !t.isStart);
  safeTilesForPowerup.sort(() => Math.random() - 0.5).slice(0, powerupCount).forEach((t, i) => {
    const tile = tiles.find(x => x.r === t.r && x.c === t.c);
    if (tile) tile.powerup = powerupTypes[i % powerupTypes.length];
  });

  // Set checkpoint visible
  const checkpoint = tiles.find(t => t.isCheckpoint);
  if (checkpoint) checkpoint.state = 'checkpoint';

  // Reveal start tile
  const start = tiles.find(t => t.isStart);
  if (start) start.state = 'revealed';

  return tiles;
}

// ─── TRAIL PARTICLE ──────────────────────────────────────────────
function TrailParticle({ x, y, trailId }) {
  const colors = {
    sparkle: ['#FFD700', '#FFF', '#FFB6C1', '#87CEEB'],
    fire: ['#FF4500', '#FF8C00', '#FFD700', '#FF6347'],
    rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'],
  };
  const c = colors[trailId] || ['#FFD700'];
  const color = c[Math.floor(Math.random() * c.length)];
  return (
    <div className="trail-particle" style={{
      left: x + '%',
      top: y + '%',
      background: color,
      boxShadow: `0 0 4px ${color}`,
    }} />
  );
}

// ─── CHICKEN COMPONENT ───────────────────────────────────────────
function Chicken({ skin, trail, animState, position, gridCols, gridRows, cellW, cellH }) {
  const skinData = CHICKEN_SKINS.find(s => s.id === skin) || CHICKEN_SKINS[0];
  const outfitClass = `chicken-outfit-${skinData.outfit || 'classic'}`;

  // Position chicken at center of the tile using pixel coordinates
  // Each cell is cellW x cellH, with 2px gaps
  const pixelX = position.c * (cellW + 2) + cellW / 2;
  const pixelY = position.r * (cellH + 2) + cellH / 2;

  return (
    <div
      className={`chicken-entity ${outfitClass} anim-${animState}`}
      style={{
        position: 'absolute',
        left: pixelX,
        top: pixelY,
        transform: 'translate(-50%, -50%)',
        zIndex: 20,
        transition: 'left 0.2s ease, top 0.2s ease',
        pointerEvents: 'none',
      }}
    >
      <div className="chicken-body" style={{ background: skinData.color }}>
        <div className="chicken-head" style={{ background: skinData.color }}>
          <div className="chicken-eye left-eye" />
          <div className="chicken-eye right-eye" />
          <div className="chicken-beak" />
          {skinData.hat && <div className="chicken-hat">{skinData.hat}</div>}
          {skinData.outfit === 'ninja' && <div className="ninja-mask" />}
          {skinData.outfit === 'ghost' && <div className="ghost-overlay" />}
        </div>
        <div className="chicken-wing left" style={{ background: skinData.color }} />
        <div className="chicken-wing right" style={{ background: skinData.color }} />
        {animState === 'shield' && <div className="shield-bubble" />}
      </div>
      <div className="chicken-legs">
        <div className="chicken-leg" style={{ background: skinData.color }} />
        <div className="chicken-leg" style={{ background: skinData.color }} />
      </div>
    </div>
  );
}

// ─── TILE COMPONENT ──────────────────────────────────────────────
function Tile({ tile, tileStyle, isAdjacent, onTap, onLongPress, cellW, cellH }) {
  const styleData = TILE_STYLES.find(s => s.id === tileStyle) || TILE_STYLES[0];
  const pressTimer = useRef(null);
  const pressed = useRef(false);

  const handleTouchStart = (e) => {
    e.preventDefault();
    pressed.current = true;
    pressTimer.current = setTimeout(() => {
      if (pressed.current) {
        onLongPress(tile);
        pressed.current = false;
      }
    }, 400);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    if (pressed.current) {
      clearTimeout(pressTimer.current);
      pressed.current = false;
      onTap(tile);
    }
  };

  const handleTouchMove = () => {
    clearTimeout(pressTimer.current);
    pressed.current = false;
  };

  const handleMouseDown = () => {
    pressed.current = true;
    pressTimer.current = setTimeout(() => {
      if (pressed.current) {
        onLongPress(tile);
        pressed.current = false;
      }
    }, 400);
  };

  const handleMouseUp = () => {
    if (pressed.current) {
      clearTimeout(pressTimer.current);
      pressed.current = false;
      onTap(tile);
    }
  };

  let bg, content, extraClass = '';

  if (tile.state === 'checkpoint') {
    bg = '#FFD700';
    content = '🏁';
    extraClass = 'tile-checkpoint';
  } else if (tile.state === 'hidden') {
    bg = styleData.hiddenColor;
    content = tile.powerup ? '✨' : '?';
    extraClass = `tile-hidden ${tile.powerup ? 'tile-powerup-glow' : ''} ${isAdjacent ? 'tile-adjacent' : ''}`;
  } else if (tile.state === 'revealed') {
    bg = styleData.safeColor;
    content = tile.powerup ? getPowerupIcon(tile.powerup) : '✓';
    extraClass = 'tile-revealed tile-flip-anim';
  } else if (tile.state === 'mine') {
    bg = styleData.mineColor;
    content = '💀';
    extraClass = 'tile-mine tile-shake';
  } else if (tile.state === 'peeked') {
    bg = tile.isMine ? '#ff6b6b' : '#90EE90';
    content = tile.isMine ? '💣' : '✓';
    extraClass = 'tile-peeked tile-flip-anim';
  }

  return (
    <div
      className={`game-tile ${extraClass}`}
      style={{
        width: cellW,
        height: cellH,
        background: bg,
        border: `2px solid ${styleData.borderColor}`,
        position: 'relative',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <span className="tile-content">{content}</span>
      {tile.state === 'hidden' && tile.powerup && (
        <div className="powerup-indicator" />
      )}
    </div>
  );
}

function getPowerupIcon(type) {
  const icons = { shield: '🛡️', slowmo: '⏱️', reveal: '👁️', doublescore: '⭐' };
  return icons[type] || '✨';
}

// ─── OBSTACLE OVERLAY ────────────────────────────────────────────
function ObstacleOverlay({ obstacle, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [obstacle]);

  if (!obstacle) return null;
  const msgs = {
    thief: { icon: '🦊', text: 'THIEF FOX!', sub: 'Stole your powerup!', cls: 'obstacle-thief' },
    wind: { icon: '💨', text: 'WIND GUST!', sub: 'You were pushed!', cls: 'obstacle-wind' },
    scramble: { icon: '🔀', text: 'SCRAMBLER!', sub: 'Tiles re-hidden!', cls: 'obstacle-scramble' },
  };
  const m = msgs[obstacle] || { icon: '⚠️', text: 'OBSTACLE!', sub: '', cls: '' };
  return (
    <div className={`obstacle-overlay ${m.cls}`}>
      <div className="obstacle-icon">{m.icon}</div>
      <div className="obstacle-text">{m.text}</div>
      <div className="obstacle-sub">{m.sub}</div>
    </div>
  );
}

// ─── CONFETTI ────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: `hsl(${Math.random() * 360}, 90%, 60%)`,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random(),
    size: 6 + Math.random() * 10,
  }));
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: `${p.x}%`,
          background: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          width: p.size,
          height: p.size,
        }} />
      ))}
    </div>
  );
}

// ─── MAIN GAMEPLAY SCREEN ─────────────────────────────────────────
export default function GameplayScreen({ startLevel = 1, onGameOver, onLevelComplete }) {
  const [level, setLevel] = useState(startLevel);
  const [tiles, setTiles] = useState([]);
  const [chicken, setChicken] = useState({ r: 0, c: 0 });
  const [timer, setTimer] = useState(30);
  const [timerMax, setTimerMax] = useState(30);
  const [seeds, setSeeds] = useState(gameStore.getSeeds());
  const [activePowerup, setActivePowerup] = useState(null);
  const [powerupTimer, setPowerupTimer] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [chickenAnim, setChickenAnim] = useState('idle');
  const [shaking, setShaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [obstacle, setObstacle] = useState(null);
  const [doubleScore, setDoubleScore] = useState(false);
  const [gamePhase, setGamePhase] = useState('playing'); // playing | levelcomplete | gameover
  const [levelSeeds, setLevelSeeds] = useState(0);
  const [rows, setRows] = useState(6);
  const [cols, setCols] = useState(8);
  const [revealAllActive, setRevealAllActive] = useState(false);
  const [slowMoActive, setSlowMoActive] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef(null);
  const powerupTimerRef = useRef(null);
  const obstacleTimerRef = useRef(null);
  const timerVal = useRef(30);
  const timerMaxVal = useRef(30);
  const slowMoRef = useRef(false);
  const levelRef = useRef(startLevel);
  const gamePhaseRef = useRef('playing');
  const pauseRef = useRef(false);
  const diffRef = useRef(null);

  const equippedSkin = gameStore.getEquippedSkin();
  const equippedTile = gameStore.getEquippedTile();
  const equippedTrail = gameStore.getEquippedTrail();

  // Initialize level
  const initLevel = useCallback((lvl) => {
    const diff = getDifficultyConfig(lvl);
    diffRef.current = diff;
    const newTiles = generateGrid(diff.rows, diff.cols, diff.mineRate, lvl);
    const startR = diff.rows - 1, startC = 0;

    setRows(diff.rows);
    setCols(diff.cols);
    setTiles(newTiles);
    setChicken({ r: startR, c: startC });
    setTimer(diff.timerMax);
    setTimerMax(diff.timerMax);
    timerVal.current = diff.timerMax;
    timerMaxVal.current = diff.timerMax;
    setActivePowerup(null);
    setPowerupTimer(0);
    setHasShield(false);
    setDoubleScore(false);
    setRevealAllActive(false);
    setSlowMoActive(false);
    slowMoRef.current = false;
    setShowConfetti(false);
    setObstacle(null);
    setChickenAnim('idle');
    levelRef.current = lvl;
    gamePhaseRef.current = 'playing';
    setGamePhase('playing');
  }, []);

  useEffect(() => {
    initLevel(startLevel);
    audio.startBackground();
  }, []);

  // Timer drain
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (pauseRef.current) return;
      if (gamePhaseRef.current !== 'playing') return;
      const diff = diffRef.current;
      const drainRate = diff ? diff.timerSpeed : 1;
      const slowFactor = slowMoRef.current ? 0.5 : 1;
      const drain = (drainRate * slowFactor) / 10; // per 100ms tick
      timerVal.current = Math.max(0, timerVal.current - drain);
      setTimer(timerVal.current);

      if (timerVal.current <= 0) {
        gamePhaseRef.current = 'gameover';
        setGamePhase('gameover');
        clearInterval(timerRef.current);
        audio.gameOver();
        triggerGameOver('timeout');
      } else if (timerVal.current <= 5 && Math.random() < 0.3) {
        audio.timerLow();
      }
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [gamePhase]);

  // Random obstacles
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const diff = diffRef.current;
    if (!diff || diff.obstacleFreq === 0) return;

    const scheduleObstacle = () => {
      const delay = (12 + Math.random() * 15) * 1000 / diff.obstacleFreq;
      obstacleTimerRef.current = setTimeout(() => {
        if (gamePhaseRef.current !== 'playing') return;
        const types = ['thief', 'wind', 'scramble'];
        const type = types[Math.floor(Math.random() * types.length)];
        triggerObstacle(type);
        scheduleObstacle();
      }, delay);
    };
    scheduleObstacle();
    return () => clearTimeout(obstacleTimerRef.current);
  }, [gamePhase, level]);

  const triggerObstacle = useCallback((type) => {
    setObstacle(type);
    if (type === 'thief') {
      audio.thiefFox();
      setActivePowerup(null);
      setHasShield(false);
      setDoubleScore(false);
      setSlowMoActive(false);
      slowMoRef.current = false;
    } else if (type === 'wind') {
      audio.windGust();
      setChicken(prev => {
        const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const diff = diffRef.current;
        const newR = Math.max(0, Math.min((diff?.rows || 6) - 1, prev.r + dir[0]));
        const newC = Math.max(0, Math.min((diff?.cols || 8) - 1, prev.c + dir[1]));
        // Reveal that tile
        setTiles(ts => ts.map(t => {
          if (t.r === newR && t.c === newC && t.state === 'hidden') {
            return { ...t, state: t.isMine ? 'mine' : 'revealed' };
          }
          return t;
        }));
        return { r: newR, c: newC };
      });
    } else if (type === 'scramble') {
      audio.obstacleScramble();
      setTiles(ts => ts.map(t => {
        if (t.state === 'revealed' && !t.isStart) {
          return { ...t, state: 'hidden' };
        }
        return t;
      }));
    }
    setTimeout(() => setObstacle(null), 2500);
  }, []);

  const triggerGameOver = (reason) => {
    clearInterval(timerRef.current);
    clearTimeout(obstacleTimerRef.current);
    const earned = 0;
    setLevelSeeds(earned);
    gamePhaseRef.current = 'gameover';
    setGamePhase('gameover');
    setChickenAnim('explode');
    setTimeout(() => {
      onGameOver({ level: levelRef.current, seeds: earned });
    }, 1500);
  };

  const isAdjacent = (tile, pos) => {
    const dr = Math.abs(tile.r - pos.r);
    const dc = Math.abs(tile.c - pos.c);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  };

  const handleTileStep = useCallback((tile) => {
    if (gamePhase !== 'playing') return;
    if (!isAdjacent(tile, chicken)) return;
    if (tile.state === 'checkpoint') {
      // Level complete!
      handleLevelComplete();
      return;
    }
    if (tile.state === 'revealed') {
      setChicken({ r: tile.r, c: tile.c });
      setChickenAnim('walk');
      setTimeout(() => setChickenAnim('idle'), 300);
      return;
    }
    if (tile.state === 'peeked') {
      if (tile.isMine) {
        handleMineHit(tile);
      } else {
        setChicken({ r: tile.r, c: tile.c });
        setChickenAnim('walk');
        setTimeout(() => setChickenAnim('idle'), 300);
      }
      return;
    }
    if (tile.state !== 'hidden') return;

    // Reveal tile
    if (tile.isMine) {
      if (tile.isFakeSafe) {
        audio.fakeMinePop();
      }
      // Check shield
      if (hasShield) {
        setHasShield(false);
        setActivePowerup(null);
        setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t, state: 'revealed', isMine: false } : t));
        setChicken({ r: tile.r, c: tile.c });
        setChickenAnim('shield');
        setTimeout(() => setChickenAnim('idle'), 600);
        return;
      }
      setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t, state: 'mine' } : t));
      handleMineHit(tile);
    } else {
      setTiles(ts => ts.map(t => t.r === tile.r && t.c === tile.c ? { ...t, state: 'revealed' } : t));
      audio.safeTap();
      setChicken({ r: tile.r, c: tile.c });
      setChickenAnim('walk');
      setTimeout(() => setChickenAnim('idle'), 300);

      // Collect powerup
      if (tile.powerup) {
        collectPowerup(tile.powerup);
      }
    }
  }, [gamePhase, chicken, hasShield, tiles]);

  const handleMineHit = (tile) => {
    setShaking(true);
    setChickenAnim('explode');
    audio.mineExplosion();
    setTimeout(() => setShaking(false), 600);
    gamePhaseRef.current = 'gameover';
    setGamePhase('gameover');
    clearInterval(timerRef.current);
    setTimeout(() => {
      onGameOver({ level: levelRef.current, seeds: 0 });
    }, 1500);
  };

  const handleLongPress = useCallback((tile) => {
    if (gamePhase !== 'playing') return;
    if (!isAdjacent(tile, chicken)) return;
    if (tile.state !== 'hidden') return;

    // Cost 1 second
    timerVal.current = Math.max(0, timerVal.current - 1);
    setTimer(timerVal.current);
    audio.peek();

    setTiles(ts => ts.map(t => {
      if (t.r === tile.r && t.c === tile.c) {
        return { ...t, state: 'peeked' };
      }
      return t;
    }));

    // Un-peek after 3 seconds if mine
    if (tile.isMine) {
      setTimeout(() => {
        setTiles(ts => ts.map(t => {
          if (t.r === tile.r && t.c === tile.c && t.state === 'peeked') {
            return { ...t, state: 'hidden' };
          }
          return t;
        }));
      }, 3000);
    }
  }, [gamePhase, chicken]);

  const collectPowerup = (type) => {
    audio.powerupCollect();
    if (type === 'shield') {
      setHasShield(true);
      setActivePowerup('shield');
    } else if (type === 'slowmo') {
      setActivePowerup('slowmo');
      setSlowMoActive(true);
      slowMoRef.current = true;
      setPowerupTimer(8);
      let t = 8;
      const interval = setInterval(() => {
        t -= 1;
        setPowerupTimer(t);
        if (t <= 0) {
          clearInterval(interval);
          setSlowMoActive(false);
          slowMoRef.current = false;
          setActivePowerup(null);
        }
      }, 1000);
    } else if (type === 'reveal') {
      setActivePowerup('reveal');
      setRevealAllActive(true);
      setTiles(ts => ts.map(t => {
        if (t.state === 'hidden' && t.isMine) {
          return { ...t, state: 'peeked' };
        }
        return t;
      }));
      setTimeout(() => {
        setRevealAllActive(false);
        setActivePowerup(null);
        setTiles(ts => ts.map(t => {
          if (t.state === 'peeked' && t.isMine) {
            return { ...t, state: 'hidden' };
          }
          return t;
        }));
      }, 2000);
    } else if (type === 'doublescore') {
      setDoubleScore(true);
      setActivePowerup('doublescore');
    }
  };

  const handleLevelComplete = () => {
    clearInterval(timerRef.current);
    clearTimeout(obstacleTimerRef.current);
    audio.levelComplete();
    setShowConfetti(true);
    setChickenAnim('celebrate');

    const lvl = levelRef.current;
    const baseSeeds = lvl * 10;
    const timeBonus = Math.floor(timerVal.current * 2);
    const earned = (baseSeeds + timeBonus) * (doubleScore ? 2 : 1);
    gameStore.addSeeds(earned);
    gameStore.updateBestLevel(lvl);
    gameStore.addLeaderboardEntry({ level: lvl, seeds: earned });
    setLevelSeeds(earned);
    setSeeds(gameStore.getSeeds());
    gamePhaseRef.current = 'levelcomplete';
    setGamePhase('levelcomplete');

    setTimeout(() => {
      const nextLevel = lvl + 1;
      levelRef.current = nextLevel;
      setLevel(nextLevel);
      initLevel(nextLevel);
    }, 2500);
  };

  // Swipe gesture
  const handleTouchStartGrid = (e) => {
    const t = e.touches[0];
    setTouchStart({ x: t.clientX, y: t.clientY });
  };

  const handleTouchEndGrid = (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    const minSwipe = 40;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

    let dir = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? [0, 1] : [0, -1];
    } else {
      dir = dy > 0 ? [1, 0] : [-1, 0];
    }

    // Find nearest tile in direction
    const cur = chicken;
    let target = null;
    for (let step = 1; step <= Math.max(rows, cols); step++) {
      const nr = cur.r + dir[0] * step;
      const nc = cur.c + dir[1] * step;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) break;
      const t2 = tiles.find(t => t.r === nr && t.c === nc);
      if (t2 && t2.state !== 'revealed') {
        target = t2;
        break;
      }
    }
    // Swipe only moves one tile at a time (to adjacent)
    if (dir) {
      const nr = cur.r + dir[0];
      const nc = cur.c + dir[1];
      const adjTile = tiles.find(t => t.r === nr && t.c === nc);
      if (adjTile) handleTileStep(adjTile);
    }
    setTouchStart(null);
  };

  // Grid dimensions
  const gridContainerRef = useRef(null);
  const [cellSize, setCellSize] = useState({ w: 44, h: 44 });

  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gridW = vw - 16;
      const gridH = vh * 0.65;
      const cw = Math.floor(gridW / cols);
      const ch = Math.floor(gridH / rows);
      setCellSize({ w: Math.max(cw, 44), h: Math.max(ch, 44) });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [rows, cols]);

  const timerPct = (timer / timerMax) * 100;
  const timerColor = timerPct > 50 ? '#4CAF50' : timerPct > 25 ? '#FF9800' : '#F44336';

  const bgColors = [
    '#1a237e', '#1b5e20', '#4a148c', '#b71c1c', '#006064',
    '#e65100', '#1a237e', '#33691e', '#880e4f', '#01579b',
  ];
  const bgColor = bgColors[Math.floor((level - 1) / 10) % bgColors.length];
  const bgColor2 = bgColors[(Math.floor((level - 1) / 10) + 1) % bgColors.length];

  return (
    <div
      className={`gameplay-screen ${shaking ? 'screen-shake' : ''}`}
      style={{ background: `linear-gradient(135deg, ${bgColor}, ${bgColor2})` }}
      onTouchStart={handleTouchStartGrid}
      onTouchEnd={handleTouchEndGrid}
    >
      {showConfetti && <Confetti />}
      <ObstacleOverlay obstacle={obstacle} onDone={() => setObstacle(null)} />

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div className="hud-level">Lv.{level}</div>
          <div className={`timer-bar-container ${slowMoActive ? 'slowmo-glow' : ''}`}>
            <div
              className="timer-bar-fill"
              style={{
                width: `${timerPct}%`,
                background: timerColor,
                transition: 'width 0.1s linear',
              }}
            />
            <div className="timer-text">{Math.ceil(timer)}s</div>
          </div>
          <div className="hud-seeds">🌾{seeds}</div>
        </div>
        <div className="hud-bottom">
          <div className="powerup-slot">
            {activePowerup ? (
              <div className="powerup-active">
                {getPowerupIcon(activePowerup)}
                {powerupTimer > 0 && <span className="powerup-timer">{powerupTimer}s</span>}
              </div>
            ) : (
              <div className="powerup-empty">🔲</div>
            )}
          </div>
          {hasShield && <div className="shield-indicator">🛡️ SHIELD</div>}
          {doubleScore && <div className="doublescore-indicator">⭐ 2X</div>}
          {slowMoActive && <div className="slowmo-indicator">⏱️ SLOW</div>}
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid-container" ref={gridContainerRef}>
        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cellSize.w}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize.h}px)`,
            gap: '2px',
            position: 'relative',
          }}
        >
          {tiles.map(tile => (
            <Tile
              key={`${tile.r}-${tile.c}`}
              tile={tile}
              tileStyle={equippedTile}
              isAdjacent={isAdjacent(tile, chicken)}
              onTap={handleTileStep}
              onLongPress={handleLongPress}
              cellW={cellSize.w}
              cellH={cellSize.h}
            />
          ))}
        </div>

        {/* Chicken overlay */}
        <div
          className="chicken-overlay"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none',
          }}
        >
          <Chicken
            skin={equippedSkin}
            trail={equippedTrail}
            animState={chickenAnim}
            position={chicken}
            gridCols={cols}
            gridRows={rows}
            cellW={cellSize.w}
            cellH={cellSize.h}
          />
        </div>
      </div>

      {/* Level complete overlay */}
      {gamePhase === 'levelcomplete' && (
        <div className="level-complete-overlay">
          <div className="level-complete-text">LEVEL {level - 1} DONE! 🎉</div>
          <div className="level-seeds-earned">+{levelSeeds} 🌾</div>
          <div className="level-next-text">Next level incoming...</div>
        </div>
      )}

      {/* Hint */}
      {level === 1 && gamePhase === 'playing' && (
        <div className="hint-bar">Tap adjacent tile to move • Long press to peek (-1s)</div>
      )}
    </div>
  );
}
