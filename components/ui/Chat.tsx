'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ClientMessage } from '@/lib/types';

interface ChatProps {
  sendMessage: (message: ClientMessage) => void;
}

export function Chat({ sendMessage }: ChatProps) {
  const { chatMessages, playerName } = useGameStore();
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message) return;

    sendMessage({ type: 'SEND_CHAT', payload: { message } });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent game controls while typing
    e.stopPropagation();
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Get last few messages for collapsed view
  const recentMessages = chatMessages.slice(-3);

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {isExpanded ? (
        <div className="bg-gray-800/95 rounded-lg shadow-lg flex flex-col w-80 h-64 border border-gray-700">
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white text-sm font-bold">Chat</h3>
            <button
              onClick={toggleExpand}
              className="text-gray-400 hover:text-white text-sm"
            >
              Minimize
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No messages yet</p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="text-sm break-words">
                  <span
                    className={
                      msg.playerName.toLowerCase() === playerName?.toLowerCase()
                        ? 'text-blue-400 font-medium'
                        : 'text-gray-400'
                    }
                  >
                    {msg.playerName}:
                  </span>
                  <span className="text-white ml-1">{msg.message}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={200}
              className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </form>
        </div>
      ) : (
        <div
          onClick={toggleExpand}
          className="bg-gray-800/90 rounded-lg shadow-lg p-2 w-64 cursor-pointer hover:bg-gray-800 transition-colors border border-gray-700"
        >
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-white text-xs font-bold">Chat</h3>
            <span className="text-gray-400 text-xs">Click to expand</span>
          </div>
          <div className="space-y-0.5">
            {recentMessages.length === 0 ? (
              <p className="text-gray-500 text-xs">No messages</p>
            ) : (
              recentMessages.map((msg) => (
                <div key={msg.id} className="text-xs truncate">
                  <span className="text-gray-400">{msg.playerName}:</span>
                  <span className="text-white ml-1">{msg.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
