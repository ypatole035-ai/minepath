import React, { useState, useEffect } from 'react';
import { gameStore } from '../store/gameStore';
import { CHICKEN_SKINS, TILE_STYLES, TRAIL_EFFECTS } from '../data/skins';
import { audio } from '../audio/engine';

function SkinPreview({ skin, equipped, owned }) {
  return (
    <div className={`skin-preview ${equipped ? 'equipped' : ''} ${owned ? 'owned' : 'locked'}`}>
      <div className="skin-chicken" style={{ background: skin.color }}>
        <div className="skin-head" style={{ background: skin.color }}>
          <div className="skin-eye l" />
          <div className="skin-eye r" />
          <div className="skin-beak" />
          {skin.hat && <div className="skin-hat-icon">{skin.hat}</div>}
          {skin.outfit === 'ninja' && <div className="skin-ninja-mask" />}
          {skin.outfit === 'ghost' && <div className="skin-ghost-overlay" />}
        </div>
        <div className="skin-wing l" style={{ background: skin.color }} />
        <div className="skin-wing r" style={{ background: skin.color }} />
      </div>
    </div>
  );
}

function TilePreview({ style }) {
  return (
    <div className="tile-preview-grid">
      <div className="tp-tile" style={{ background: style.hiddenColor, border: `2px solid ${style.borderColor}` }}>?</div>
      <div className="tp-tile" style={{ background: style.safeColor, border: `2px solid ${style.borderColor}` }}>✓</div>
      <div className="tp-tile" style={{ background: style.mineColor, border: `2px solid ${style.borderColor}` }}>💀</div>
    </div>
  );
}

export default function ShopScreen({ onBack }) {
  const [tab, setTab] = useState('skins');
  const [seeds, setSeeds] = useState(gameStore.getSeeds());
  const [unlockedSkins, setUnlockedSkins] = useState(gameStore.getUnlockedSkins());
  const [unlockedTiles, setUnlockedTiles] = useState(gameStore.getUnlockedTiles());
  const [unlockedTrails, setUnlockedTrails] = useState(gameStore.getUnlockedTrails());
  const [equippedSkin, setEquippedSkin] = useState(gameStore.getEquippedSkin());
  const [equippedTile, setEquippedTile] = useState(gameStore.getEquippedTile());
  const [equippedTrail, setEquippedTrail] = useState(gameStore.getEquippedTrail());
  const [msg, setMsg] = useState('');

  const refresh = () => {
    setSeeds(gameStore.getSeeds());
    setUnlockedSkins(gameStore.getUnlockedSkins());
    setUnlockedTiles(gameStore.getUnlockedTiles());
    setUnlockedTrails(gameStore.getUnlockedTrails());
    setEquippedSkin(gameStore.getEquippedSkin());
    setEquippedTile(gameStore.getEquippedTile());
    setEquippedTrail(gameStore.getEquippedTrail());
  };

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 2000);
  };

  const buySkin = (skin) => {
    if (unlockedSkins.includes(skin.id)) {
      gameStore.setEquippedSkin(skin.id);
      setEquippedSkin(skin.id);
      showMsg(`Equipped ${skin.name}!`);
    } else {
      if (gameStore.spendSeeds(skin.price)) {
        gameStore.unlockSkin(skin.id);
        gameStore.setEquippedSkin(skin.id);
        refresh();
        audio.powerupCollect();
        showMsg(`Unlocked ${skin.name}!`);
      } else {
        showMsg('Not enough seeds! 🌾');
      }
    }
  };

  const buyTile = (style) => {
    if (unlockedTiles.includes(style.id)) {
      gameStore.setEquippedTile(style.id);
      setEquippedTile(style.id);
      showMsg(`Equipped ${style.name}!`);
    } else {
      if (gameStore.spendSeeds(style.price)) {
        gameStore.unlockTile(style.id);
        gameStore.setEquippedTile(style.id);
        refresh();
        audio.powerupCollect();
        showMsg(`Unlocked ${style.name}!`);
      } else {
        showMsg('Not enough seeds! 🌾');
      }
    }
  };

  const buyTrail = (trail) => {
    if (unlockedTrails.includes(trail.id)) {
      gameStore.setEquippedTrail(trail.id);
      setEquippedTrail(trail.id);
      showMsg(`Equipped ${trail.name}!`);
    } else {
      if (gameStore.spendSeeds(trail.price)) {
        gameStore.unlockTrail(trail.id);
        gameStore.setEquippedTrail(trail.id);
        refresh();
        audio.powerupCollect();
        showMsg(`Unlocked ${trail.name}!`);
      } else {
        showMsg('Not enough seeds! 🌾');
      }
    }
  };

  return (
    <div className="shop-screen">
      <div className="shop-header">
        <button
          className="btn-back"
          onTouchStart={(e) => { e.preventDefault(); onBack(); }}
          onClick={onBack}
        >
          ← Back
        </button>
        <div className="shop-title">🛒 SHOP</div>
        <div className="shop-seeds">🌾 {seeds}</div>
      </div>

      {msg && <div className="shop-msg">{msg}</div>}

      <div className="shop-tabs">
        {['skins', 'tiles', 'trails'].map(t => (
          <button
            key={t}
            className={`shop-tab ${tab === t ? 'active' : ''}`}
            onTouchStart={(e) => { e.preventDefault(); setTab(t); }}
            onClick={() => setTab(t)}
          >
            {t === 'skins' ? '🐔 Skins' : t === 'tiles' ? '🟦 Tiles' : '✨ Trails'}
          </button>
        ))}
      </div>

      <div className="shop-items">
        {tab === 'skins' && CHICKEN_SKINS.map(skin => {
          const owned = unlockedSkins.includes(skin.id);
          const isEquipped = equippedSkin === skin.id;
          return (
            <div key={skin.id} className={`shop-item ${isEquipped ? 'equipped-item' : ''}`}>
              <SkinPreview skin={skin} equipped={isEquipped} owned={owned} />
              <div className="shop-item-info">
                <div className="shop-item-name">{skin.name}</div>
                <div className="shop-item-desc">{skin.description}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button
                className={`shop-buy-btn ${owned ? 'btn-equip' : 'btn-buy'}`}
                onTouchStart={(e) => { e.preventDefault(); buySkin(skin); }}
                onClick={() => buySkin(skin)}
              >
                {owned
                  ? (isEquipped ? '✅' : '👗 Equip')
                  : `🌾 ${skin.price}`}
              </button>
            </div>
          );
        })}

        {tab === 'tiles' && TILE_STYLES.map(style => {
          const owned = unlockedTiles.includes(style.id);
          const isEquipped = equippedTile === style.id;
          return (
            <div key={style.id} className={`shop-item ${isEquipped ? 'equipped-item' : ''}`}>
              <TilePreview style={style} />
              <div className="shop-item-info">
                <div className="shop-item-name">{style.name}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button
                className={`shop-buy-btn ${owned ? 'btn-equip' : 'btn-buy'}`}
                onTouchStart={(e) => { e.preventDefault(); buyTile(style); }}
                onClick={() => buyTile(style)}
              >
                {owned
                  ? (isEquipped ? '✅' : '🎨 Equip')
                  : `🌾 ${style.price}`}
              </button>
            </div>
          );
        })}

        {tab === 'trails' && TRAIL_EFFECTS.map(trail => {
          const owned = unlockedTrails.includes(trail.id);
          const isEquipped = equippedTrail === trail.id;
          return (
            <div key={trail.id} className={`shop-item ${isEquipped ? 'equipped-item' : ''}`}>
              <div className="trail-preview">
                {trail.id === 'sparkle' && <div className="trail-sparkle-demo">✨✨✨</div>}
                {trail.id === 'fire' && <div className="trail-fire-demo">🔥🔥🔥</div>}
                {trail.id === 'rainbow' && <div className="trail-rainbow-demo">🌈</div>}
                {trail.id === 'none' && <div className="trail-none-demo">——</div>}
              </div>
              <div className="shop-item-info">
                <div className="shop-item-name">{trail.name}</div>
                <div className="shop-item-desc">{trail.description}</div>
                {isEquipped && <div className="equipped-badge">✅ Equipped</div>}
              </div>
              <button
                className={`shop-buy-btn ${owned ? 'btn-equip' : 'btn-buy'}`}
                onTouchStart={(e) => { e.preventDefault(); buyTrail(trail); }}
                onClick={() => buyTrail(trail)}
              >
                {owned
                  ? (isEquipped ? '✅' : '✨ Equip')
                  : `🌾 ${trail.price}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
