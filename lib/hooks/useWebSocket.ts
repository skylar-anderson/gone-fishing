'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ClientMessage, ServerMessage, SceneId } from '@/lib/types';

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const {
    playerName,
    currentScene,
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
    addToast,
  } = useGameStore();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);

        switch (message.type) {
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

          case 'ERROR':
            console.error('[WebSocket] Server error:', message.payload.message);
            addToast(message.payload.message, 'error');
            // Reset state based on error code
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
      addToast,
    ]
  );

  const connect = useCallback(
    (name: string, scene: SceneId) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        // Already connected, just send join
        sendMessage({ type: 'JOIN', payload: { name, scene } });
        return;
      }

      setConnecting(true);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnected(true);
        reconnectAttempts.current = 0;

        // Send join message
        sendMessage({ type: 'JOIN', payload: { name, scene } });
      };

      ws.current.onmessage = handleMessage;

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setConnected(false);

        // Attempt reconnect
        if (reconnectAttempts.current < maxReconnectAttempts && playerName && currentScene) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          setTimeout(() => connect(playerName, currentScene), delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    },
    [
      playerName,
      currentScene,
      setConnecting,
      setConnected,
      handleMessage,
    ]
  );

  const disconnect = useCallback(() => {
    reconnectAttempts.current = maxReconnectAttempts; // Prevent reconnect
    ws.current?.close();
    ws.current = null;
  }, []);

  const sendMessage = useCallback((message: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
  };
}
