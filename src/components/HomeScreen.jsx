import React, { useEffect, useState } from 'react';
import { gameStore } from '../store/gameStore';
import { audio } from '../audio/engine';

export default function HomeScreen({ onPlay, onShop, onLeaderboard }) {
  const [seeds, setSeeds] = useState(0);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setSeeds(gameStore.getSeeds());
    audio.startBackground();
    return () => {};
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setBounce(b => !b), 800);
    return () => clearInterval(interval);
  }, []);

  const bestLevel = gameStore.getBestLevel();

  return (
    <div className="home-screen">
      <div className="stars-bg">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
          }} />
        ))}
      </div>

      <div className="home-content">
        <div className="logo-container">
          <div className="logo-text">MINE</div>
          <div className="logo-text logo-path">PATH</div>
          <div className="logo-subtitle">🌾 Step carefully, little chicken! 🌾</div>
        </div>

        <div className={`home-chicken ${bounce ? 'bounce-up' : 'bounce-down'}`}>
          <div className="chicken-body-main">
            <div className="chicken-head-main">
              <div className="chicken-eye-main left" />
              <div className="chicken-eye-main right" />
              <div className="chicken-beak-main" />
              <div className="chicken-comb-main" />
            </div>
            <div className="chicken-wing-main left-wing" />
            <div className="chicken-wing-main right-wing" />
            <div className="chicken-feet-main">
              <div className="chicken-foot" />
              <div className="chicken-foot" />
            </div>
          </div>
        </div>

        <div className="seeds-display">
          🌾 {seeds} Seeds
          {bestLevel > 0 && <span className="best-level"> | Best: Level {bestLevel}</span>}
        </div>

        <div className="home-buttons">
          <button
            className="btn-primary btn-play"
            onTouchStart={(e) => { e.preventDefault(); audio.init(); onPlay(); }}
            onClick={() => { audio.init(); onPlay(); }}
          >
            🎮 PLAY
          </button>
          <div className="home-buttons-row">
            <button
              className="btn-secondary btn-shop"
              onTouchStart={(e) => { e.preventDefault(); onShop(); }}
              onClick={onShop}
            >
              🛒 SHOP
            </button>
            <button
              className="btn-secondary btn-leader"
              onTouchStart={(e) => { e.preventDefault(); onLeaderboard(); }}
              onClick={onLeaderboard}
            >
              🏆 SCORES
            </button>
          </div>
        </div>

        <div className="home-hint">
          Tap tiles to move 🐔 | Long press to peek 👁️
        </div>
      </div>
    </div>
  );
}
