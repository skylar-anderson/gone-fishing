'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ClientMessage, ServerMessage, SceneId } from '@/lib/types';

// Module-level singleton state (persists across component instances and navigations)
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let lastCredentials: { password: string; isRegistering: boolean } | null = null;
let isConnecting = false;
let messageHandler: ((event: MessageEvent) => void) | null = null;

/**
 * Create WebSocket URL based on current protocol
 */
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}

/**
 * Shared WebSocket connection setup
 */
function setupWebSocket(
  onOpen: () => void,
  onClose: (event: CloseEvent) => void,
  currentMessageHandler: (event: MessageEvent) => void
): WebSocket {
  const socket = new WebSocket(getWebSocketUrl());

  socket.onopen = onOpen;
  socket.onmessage = currentMessageHandler;
  socket.onclose = onClose;
  socket.onerror = (error) => {
    console.error('[WebSocket] Error:', error);
  };

  return socket;
}

export function useWebSocket() {
  const {
    setConnecting,
    setConnected,
    setPlayerData,
    setScene,
    setOtherPlayers,
    addOtherPlayer,
    removeOtherPlayer,
    updateOtherPlayer,
    setFishing,
    setCatch,
    updateInventory,
    setShopData,
    setShopOpen,
    setPoleLevel,
    setChatMessages,
    addChatMessage,
    setAuthError,
    addToast,
  } = useGameStore();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'SESSION_CREATED':
            // Set session cookie via HTTP API (WebSocket can't set httpOnly cookies)
            // Token is validated server-side before cookie is set
            fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: message.payload.token }),
            }).catch(err => console.error('[WebSocket] Failed to set session cookie:', err));
            break;

          case 'WELCOME':
            setPlayerData(message.payload.player);
            setScene(message.payload.scene);
            break;

          case 'SCENE_STATE':
            setOtherPlayers(message.payload.players);
            setScene(message.payload.scene);
            break;

          case 'PLAYER_JOINED':
            addOtherPlayer(message.payload);
            break;

          case 'PLAYER_LEFT':
            removeOtherPlayer(message.payload.name);
            break;

          case 'PLAYER_UPDATE':
            updateOtherPlayer(message.payload.name, {
              position: message.payload.position,
              direction: message.payload.direction,
              isFishing: message.payload.isFishing ?? false,
            });
            break;

          case 'FISHING_START':
            updateOtherPlayer(message.payload.name, { isFishing: true });
            break;

          case 'FISHING_RESULT':
            setFishing(false);
            if (message.payload.success && message.payload.fish) {
              setCatch(message.payload.fish);
            } else {
              setCatch(null);
            }
            break;

          case 'INVENTORY_UPDATE':
            updateInventory(message.payload.inventory, message.payload.money);
            break;

          case 'SHOP_OPENED':
            setShopData(message.payload);
            break;

          case 'SHOP_CLOSED':
            setShopOpen(false);
            break;

          case 'PURCHASE_SUCCESS':
            setPoleLevel(message.payload.poleLevel);
            updateInventory(useGameStore.getState().inventory, message.payload.money);
            break;

          case 'AUTH_ERROR':
            console.error('[WebSocket] Auth error:', message.payload.message);
            setAuthError(message.payload.message);
            setConnecting(false);
            break;

          case 'CHAT_MESSAGE':
            addChatMessage(message.payload);
            break;

          case 'CHAT_HISTORY':
            setChatMessages(message.payload.messages);
            break;

          case 'ERROR':
            console.error('[WebSocket] Server error:', message.payload.message);
            addToast(message.payload.message, 'error');
            if (message.payload.code === 'CANNOT_FISH') {
              setFishing(false);
            }
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    },
    [
      setPlayerData,
      setScene,
      setOtherPlayers,
      addOtherPlayer,
      removeOtherPlayer,
      updateOtherPlayer,
      setFishing,
      setCatch,
      updateInventory,
      setShopData,
      setShopOpen,
      setPoleLevel,
      setChatMessages,
      addChatMessage,
      setAuthError,
      setConnecting,
      addToast,
    ]
  );

  // Keep the message handler updated when callbacks change
  useEffect(() => {
    messageHandler = handleMessage;
    if (ws) {
      ws.onmessage = handleMessage;
    }
  }, [handleMessage]);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected', message.type);
    }
  }, []);

  const connect = useCallback(
    (name: string, scene: SceneId, password: string, isRegistering: boolean) => {
      if (isConnecting) return;

      setAuthError(null);
      lastCredentials = { password, isRegistering };

      if (ws?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'JOIN', payload: { name, scene, password, isRegistering } });
        return;
      }

      isConnecting = true;
      setConnecting(true);

      ws = setupWebSocket(
        // onOpen
        () => {
          console.log('[WebSocket] Connected');
          isConnecting = false;
          setConnected(true);
          reconnectAttempts = 0;
          sendMessage({ type: 'JOIN', payload: { name, scene, password, isRegistering } });
        },
        // onClose
        (event) => {
          console.log('[WebSocket] Disconnected', event.code, event.reason);
          isConnecting = false;
          setConnected(false);
          setConnecting(false);

          const { playerName, currentScene, authError } = useGameStore.getState();

          if (!playerName && !authError) {
            setAuthError('Connection failed. Please try again.');
          }

          // Attempt reconnect with stored credentials
          if (reconnectAttempts < maxReconnectAttempts && playerName && currentScene && lastCredentials) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
            const { password: pw, isRegistering: reg } = lastCredentials;
            setTimeout(() => connect(playerName, currentScene, pw, reg), delay);
          }
        },
        messageHandler || handleMessage
      );
    },
    [setConnecting, setConnected, setAuthError, handleMessage, sendMessage]
  );

  const disconnect = useCallback(() => {
    reconnectAttempts = maxReconnectAttempts;
    ws?.close();
    ws = null;
  }, []);

  /**
   * Attempt to restore session from cookie
   * Returns true if restoration was initiated, false otherwise
   */
  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (ws?.readyState === WebSocket.OPEN || isConnecting) {
      return false;
    }

    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (!data.authenticated || !data.token) {
        return false;
      }

      console.log('[WebSocket] Restoring session for', data.playerName);

      isConnecting = true;
      setConnecting(true);

      ws = setupWebSocket(
        // onOpen
        () => {
          console.log('[WebSocket] Connected (session restore)');
          isConnecting = false;
          setConnected(true);
          reconnectAttempts = 0;
          // Send token for server-side validation
          sendMessage({ type: 'SESSION_RESTORE', payload: { token: data.token } });
        },
        // onClose
        (event) => {
          console.log('[WebSocket] Disconnected (session restore)', event.code, event.reason);
          isConnecting = false;
          setConnected(false);
          setConnecting(false);
        },
        messageHandler || handleMessage
      );

      return true;
    } catch (error) {
      console.error('[WebSocket] Session restore failed:', error);
      return false;
    }
  }, [setConnecting, setConnected, handleMessage, sendMessage]);

  return {
    connect,
    disconnect,
    sendMessage,
    restoreSession,
  };
}
