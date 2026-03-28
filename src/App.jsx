import React, { useState, useCallback } from 'react';
import HomeScreen from './components/HomeScreen';
import GameplayScreen from './components/GameplayScreen';
import GameOverScreen from './components/GameOverScreen';
import ShopScreen from './components/ShopScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import { gameStore } from './store/gameStore';
import './styles/game.css';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [gameOverData, setGameOverData] = useState({ level: 1, seeds: 0 });
  const [currentLevel, setCurrentLevel] = useState(1);

  const goHome = useCallback(() => {
    setCurrentLevel(1);
    setScreen('home');
  }, []);

  const goPlay = useCallback(() => {
    setCurrentLevel(1);
    setScreen('game');
  }, []);

  const goShop = useCallback(() => setScreen('shop'), []);
  const goLeaderboard = useCallback(() => setScreen('leaderboard'), []);

  const handleGameOver = useCallback((data) => {
    setGameOverData(data);
    setScreen('gameover');
  }, []);

  return (
    <div className="app-root">
      {screen === 'home' && (
        <HomeScreen
          onPlay={goPlay}
          onShop={goShop}
          onLeaderboard={goLeaderboard}
        />
      )}
      {screen === 'game' && (
        <GameplayScreen
          key={currentLevel}
          startLevel={currentLevel}
          onGameOver={handleGameOver}
          onLevelComplete={() => {}}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          level={gameOverData.level}
          seeds={gameOverData.seeds}
          onPlayAgain={() => {
            setCurrentLevel(1);
            setScreen('game');
          }}
          onShop={goShop}
          onHome={goHome}
        />
      )}
      {screen === 'shop' && (
        <ShopScreen onBack={() => setScreen('home')} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('home')} />
      )}
    </div>
  );
}
