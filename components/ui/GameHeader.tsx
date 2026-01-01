'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ClientMessage } from '@/lib/types';
import { getPole } from '@/data/poles';
import { Inventory } from './Inventory';
import { PlayerList } from './PlayerList';
import { SceneSelector } from './SceneSelector';
import { useAnimateOnChange } from '@/lib/hooks/useAnimateOnChange';
import { useSound } from '@/lib/hooks/useSound';
import { useButtonSound } from '@/lib/hooks/useButtonSound';

interface PopoverButtonProps {
  children: ReactNode;
  popover: ReactNode;
  align?: 'left' | 'right';
}

function PopoverButton({ children, popover, align = 'left' }: PopoverButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const withSound = useButtonSound();

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={withSound(() => setIsOpen(!isOpen))}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
          hover:bg-gray-700/50
          ${isOpen ? 'bg-gray-700/70 ring-1 ring-blue-500/50' : ''}
        `}
      >
        {children}
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full mt-2 z-50
            ${align === 'right' ? 'right-0' : 'left-0'}
            min-w-[280px] max-w-[360px] max-h-[70vh] overflow-auto
            bg-gray-800/95 backdrop-blur-sm
            border border-gray-600/50 rounded-lg shadow-xl
            animate-fade-in
          `}
        >
          {popover}
        </div>
      )}
    </div>
  );
}

interface GameHeaderProps {
  sendMessage: (message: ClientMessage) => void;
  onLogout: () => void;
}

export function GameHeader({ sendMessage, onLogout }: GameHeaderProps) {
  const { playerName, scene, money, poleLevel, inventory, otherPlayers } = useGameStore();
  const currentPole = getPole(poleLevel);
  const playerCount = 1 + otherPlayers.size;
  const withSound = useButtonSound();

  // Animation states
  const isMoneyAnimating = useAnimateOnChange(money);
  const isCountAnimating = useAnimateOnChange(inventory.length);

  // Sound effects - only cash sound here, inventory sound is in CatchModal
  const prevMoneyRef = useRef(money);
  const { play: playCashSound } = useSound('/sounds/cash.wav', { maxDuration: 1700 });

  // Play cash sound when money increases
  useEffect(() => {
    if (money > prevMoneyRef.current) {
      playCashSound();
    }
    prevMoneyRef.current = money;
  }, [money, playCashSound]);

  return (
    <header className="flex-shrink-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 px-4 py-2 relative z-50">
      <div className="flex justify-between items-center">
        {/* Left side */}
        <div className="flex items-center gap-1">
          {/* Player name */}
          <span className="text-blue-400 font-medium px-2">{playerName}</span>

          {/* Logout */}
          <button
            onClick={withSound(onLogout)}
            className="px-2 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all text-sm"
          >
            Logout
          </button>

          {/* Location switcher */}
          <PopoverButton
            popover={<SceneSelector sendMessage={sendMessage} />}
            align="left"
          >
            <span className="text-gray-400">📍</span>
            <span className="text-gray-300">{scene?.name || 'Loading...'}</span>
          </PopoverButton>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Players online */}
          <PopoverButton
            popover={<PlayerList />}
            align="right"
          >
            <span className="text-gray-300 text-sm">{playerCount} online</span>
          </PopoverButton>

          {/* Pole / Shop */}
          <PopoverButton
            popover={
              <div className="p-4">
                <h3 className="text-white font-bold mb-2">Current Pole</h3>
                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-700/50 rounded">
                  <span className="text-2xl">{currentPole.emoji}</span>
                  <div>
                    <div className="text-purple-400 font-medium">{currentPole.name}</div>
                    <div className="text-gray-400 text-xs">{currentPole.description}</div>
                  </div>
                </div>
                <button
                  onClick={withSound(() => sendMessage({ type: 'OPEN_SHOP', payload: {} }))}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Upgrade Pole
                </button>
                <p className="text-gray-500 text-xs mt-2">Stand near a shop tile (purple) to upgrade</p>
              </div>
            }
            align="right"
          >
            <span className="text-purple-400">{currentPole.emoji}</span>
            <span className="text-purple-300 text-sm hidden sm:inline">{currentPole.name}</span>
          </PopoverButton>

          {/* Inventory */}
          <PopoverButton
            popover={<Inventory sendMessage={sendMessage} />}
            align="right"
          >
            <span
              className={`font-bold transition-all duration-300 ${
                isMoneyAnimating
                  ? 'text-green-400 scale-125'
                  : 'text-yellow-400 scale-100'
              }`}
            >
              ${money}
            </span>
            {inventory.length > 0 && (
              <span
                className={`text-white text-xs font-bold px-1.5 py-0.5 rounded-full transition-all duration-300 ${
                  isCountAnimating
                    ? 'bg-green-500 scale-125'
                    : 'bg-blue-500 scale-100'
                }`}
              >
                {inventory.length}
              </span>
            )}
          </PopoverButton>
        </div>
      </div>
    </header>
  );
}
