import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuid } from 'uuid';
import {
  ClientMessage,
  ServerMessage,
  SceneId,
  Position,
  Direction,
  OtherPlayer,
  InventoryItem,
  ShopState,
} from '@/lib/types';
import { SceneManager } from './SceneManager';
import { PlayerManager } from './PlayerManager';
import { FishingSystem } from './FishingSystem';
import { ChatManager } from './ChatManager';
import { SessionManager } from './SessionManager';
import { canMoveTo, isAdjacentToTileType } from '@/lib/utils/collision';
import { getPole, getNextPole } from '@/data/poles';

interface Connection {
  ws: WebSocket;
  playerName: string | null;
  currentScene: SceneId | null;
}

export class GameServer {
  private wss: WebSocketServer;
  private connections: Map<string, Connection> = new Map();
  private playerConnections: Map<string, string> = new Map(); // playerName -> connectionId
  private sceneManager: SceneManager;
  private playerManager: PlayerManager;
  private fishingSystem: FishingSystem;
  private chatManager: ChatManager;
  private sessionManager: SessionManager;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.sceneManager = new SceneManager();
    this.playerManager = new PlayerManager();
    this.fishingSystem = new FishingSystem();
    this.chatManager = new ChatManager();
    this.sessionManager = new SessionManager();
  }

  start(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const connectionId = uuid();
      this.connections.set(connectionId, {
        ws,
        playerName: null,
        currentScene: null,
      });

      console.log(`[GameServer] New connection: ${connectionId}`);

      ws.on('message', (data) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('[GameServer] Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(connectionId);
      });

      ws.on('error', (error) => {
        console.error(`[GameServer] WebSocket error for ${connectionId}:`, error);
      });
    });

    console.log('[GameServer] Game server started');
  }

  private async handleMessage(connectionId: string, message: ClientMessage): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'JOIN':
        await this.handleJoin(connectionId, message.payload);
        break;
      case 'SESSION_RESTORE':
        await this.handleSessionRestore(connectionId, message.payload);
        break;
      case 'MOVE':
        this.handleMove(connectionId, message.payload);
        break;
      case 'CHANGE_SCENE':
        await this.handleChangeScene(connectionId, message.payload);
        break;
      case 'START_FISHING':
        await this.handleStartFishing(connectionId);
        break;
      case 'SELL_FISH':
        await this.handleSellFish(connectionId, message.payload);
        break;
      case 'OPEN_SHOP':
        await this.handleOpenShop(connectionId);
        break;
      case 'BUY_POLE_UPGRADE':
        await this.handleBuyPoleUpgrade(connectionId);
        break;
      case 'CLOSE_SHOP':
        this.handleCloseShop(connectionId);
        break;
      case 'SEND_CHAT':
        await this.handleSendChat(connectionId, message.payload);
        break;
    }
  }

  private async handleJoin(
    connectionId: string,
    payload: { name: string; scene: SceneId; password: string; isRegistering?: boolean }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { name, scene, password, isRegistering } = payload;

    // Validate name (must match client-side validation in LoginForm.tsx)
    const trimmedName = name?.trim() || '';
    if (trimmedName.length < 2 || trimmedName.length > 16) {
      this.send(connection.ws, {
        type: 'AUTH_ERROR',
        payload: { message: 'Name must be 2-16 characters', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      this.send(connection.ws, {
        type: 'AUTH_ERROR',
        payload: { message: 'Name can only contain letters, numbers, and underscores', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    // Validate password
    if (!password || password.length < 4) {
      this.send(connection.ws, {
        type: 'AUTH_ERROR',
        payload: { message: 'Password must be at least 4 characters', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    // Check if player already connected
    const existingConnectionId = this.playerConnections.get(trimmedName.toLowerCase());
    if (existingConnectionId && existingConnectionId !== connectionId) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Player already connected', code: 'ALREADY_CONNECTED' },
      });
      return;
    }

    let player;
    let isNewPlayer = false;
    const playerExists = await this.playerManager.playerExists(trimmedName);

    if (isRegistering) {
      // Registration flow
      if (playerExists) {
        this.send(connection.ws, {
          type: 'AUTH_ERROR',
          payload: { message: 'Username already taken', code: 'NAME_TAKEN' },
        });
        return;
      }
      player = await this.playerManager.create(trimmedName, scene, password);
      isNewPlayer = true;
    } else {
      // Login flow
      if (!playerExists) {
        this.send(connection.ws, {
          type: 'AUTH_ERROR',
          payload: { message: 'Player not found. Create an account first.', code: 'PLAYER_NOT_FOUND' },
        });
        return;
      }

      const validPassword = await this.playerManager.validatePassword(trimmedName, password);
      if (!validPassword) {
        this.send(connection.ws, {
          type: 'AUTH_ERROR',
          payload: { message: 'Invalid password', code: 'INVALID_CREDENTIALS' },
        });
        return;
      }

      player = await this.playerManager.get(trimmedName);
      if (player) {
        player = (await this.playerManager.update(trimmedName, { lastLogin: new Date().toISOString() }))!;
      }
    }

    if (!player) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Failed to load player', code: 'LOAD_FAILED' },
      });
      return;
    }

    // Update connection
    connection.playerName = trimmedName;
    connection.currentScene = scene;
    this.playerConnections.set(trimmedName.toLowerCase(), connectionId);

    // Add to scene at last position or spawn point
    const sceneData = this.sceneManager.getScene(scene);
    const position = player.lastScene === scene ? player.lastPosition : sceneData?.spawnPoint || { x: 5, y: 5 };
    this.sceneManager.addPlayer(scene, trimmedName, position);

    console.log(`[GameServer] Player ${trimmedName} joined scene ${scene}${isNewPlayer ? ' (new player)' : ''}`);

    // Create session and send token (client will set cookie via HTTP API)
    const playerRow = await this.playerManager.getPlayerRow(trimmedName);
    if (playerRow) {
      const sessionToken = await this.sessionManager.createSession(playerRow.id);
      this.send(connection.ws, {
        type: 'SESSION_CREATED',
        payload: { token: sessionToken },
      });
    }

    // Send welcome message
    if (sceneData) {
      this.send(connection.ws, {
        type: 'WELCOME',
        payload: { player, scene: sceneData, isNewPlayer },
      });
    }

    // Broadcast to other players in scene
    const otherPlayer: OtherPlayer = {
      name: trimmedName,
      position,
      currentScene: scene,
      direction: 'down',
      isFishing: false,
    };
    this.broadcastToScene(
      scene,
      { type: 'PLAYER_JOINED', payload: otherPlayer },
      trimmedName
    );

    // Send current players in scene to new player
    const playersInScene = this.sceneManager.getPlayersInScene(scene).filter((p) => p.name !== trimmedName);
    if (sceneData) {
      this.send(connection.ws, {
        type: 'SCENE_STATE',
        payload: { players: playersInScene, scene: sceneData },
      });

      // Send chat history for this scene
      const chatHistory = await this.chatManager.getRecentMessages(scene);
      this.send(connection.ws, {
        type: 'CHAT_HISTORY',
        payload: { messages: chatHistory },
      });
    }
  }

  /**
   * Handle session restoration (reconnection via session token)
   * Validates the token server-side for security
   */
  private async handleSessionRestore(
    connectionId: string,
    payload: { token: string }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    const { token } = payload;

    // Validate session token server-side
    const session = await this.sessionManager.validateSession(token);
    if (!session) {
      this.send(connection.ws, {
        type: 'AUTH_ERROR',
        payload: { message: 'Session expired', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    const playerName = session.playerName;

    // Get full player data
    const player = await this.playerManager.get(playerName);
    if (!player) {
      this.send(connection.ws, {
        type: 'AUTH_ERROR',
        payload: { message: 'Player not found', code: 'INVALID_CREDENTIALS' },
      });
      return;
    }

    // Use player's last scene
    const scene = player.lastScene;

    // Check if player already connected elsewhere
    const existingConnectionId = this.playerConnections.get(playerName.toLowerCase());
    if (existingConnectionId && existingConnectionId !== connectionId) {
      // Disconnect old connection
      const oldConnection = this.connections.get(existingConnectionId);
      if (oldConnection) {
        this.send(oldConnection.ws, {
          type: 'ERROR',
          payload: { message: 'Connected from another location', code: 'DUPLICATE_SESSION' },
        });
        oldConnection.ws.close();
      }
    }

    // Update connection
    connection.playerName = playerName;
    connection.currentScene = scene;
    this.playerConnections.set(playerName.toLowerCase(), connectionId);

    // Add to scene at last position or spawn point
    const sceneData = this.sceneManager.getScene(scene);
    const position = player.lastScene === scene ? player.lastPosition : sceneData?.spawnPoint || { x: 5, y: 5 };
    this.sceneManager.addPlayer(scene, playerName, position);

    console.log(`[GameServer] Player ${playerName} restored session in scene ${scene}`);

    // Update last login
    await this.playerManager.update(playerName, { lastLogin: new Date().toISOString() });

    // Get updated player data
    const updatedPlayer = await this.playerManager.get(playerName);

    // Send welcome message
    if (sceneData && updatedPlayer) {
      this.send(connection.ws, {
        type: 'WELCOME',
        payload: { player: updatedPlayer, scene: sceneData, isNewPlayer: false },
      });
    }

    // Broadcast to other players in scene
    const otherPlayer: OtherPlayer = {
      name: playerName,
      position,
      currentScene: scene,
      direction: 'down',
      isFishing: false,
    };
    this.broadcastToScene(
      scene,
      { type: 'PLAYER_JOINED', payload: otherPlayer },
      playerName
    );

    // Send current players in scene
    const playersInScene = this.sceneManager.getPlayersInScene(scene).filter((p) => p.name !== playerName);
    if (sceneData) {
      this.send(connection.ws, {
        type: 'SCENE_STATE',
        payload: { players: playersInScene, scene: sceneData },
      });

      // Send chat history for this scene
      const chatHistory = await this.chatManager.getRecentMessages(scene);
      this.send(connection.ws, {
        type: 'CHAT_HISTORY',
        payload: { messages: chatHistory },
      });
    }
  }

  private handleMove(
    connectionId: string,
    payload: { position: Position; direction: Direction }
  ): void {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName || !connection.currentScene) return;

    const { position, direction } = payload;
    const scene = this.sceneManager.getScene(connection.currentScene);
    if (!scene) return;

    // Validate move
    if (!canMoveTo(scene.map, position)) {
      return; // Invalid move, ignore
    }

    // Update position in scene manager
    this.sceneManager.updatePlayerPosition(
      connection.currentScene,
      connection.playerName,
      position,
      direction
    );

    // Update persistence (debounced via dirty flag)
    this.playerManager.updatePosition(connection.playerName, position, connection.currentScene);

    // Broadcast to other players
    this.broadcastToScene(
      connection.currentScene,
      {
        type: 'PLAYER_UPDATE',
        payload: { name: connection.playerName, position, direction },
      },
      connection.playerName
    );
  }

  private async handleChangeScene(
    connectionId: string,
    payload: { scene: SceneId }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName || !connection.currentScene) return;

    const { scene: newScene } = payload;
    const oldScene = connection.currentScene;

    // Move player to new scene
    const newPosition = this.sceneManager.movePlayerToScene(
      oldScene,
      newScene,
      connection.playerName
    );

    if (!newPosition) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Invalid scene', code: 'INVALID_SCENE' },
      });
      return;
    }

    // Update connection
    connection.currentScene = newScene;

    // Update persistence
    await this.playerManager.updatePosition(connection.playerName, newPosition, newScene);

    // Broadcast departure to old scene
    this.broadcastToScene(oldScene, {
      type: 'PLAYER_LEFT',
      payload: { name: connection.playerName },
    });

    // Get new scene data
    const sceneData = this.sceneManager.getScene(newScene);
    if (!sceneData) return;

    // Send new scene state to player
    const playersInScene = this.sceneManager.getPlayersInScene(newScene).filter((p) => p.name !== connection.playerName);
    this.send(connection.ws, {
      type: 'SCENE_STATE',
      payload: { players: playersInScene, scene: sceneData },
    });

    // Send chat history for new scene
    const chatHistory = await this.chatManager.getRecentMessages(newScene);
    this.send(connection.ws, {
      type: 'CHAT_HISTORY',
      payload: { messages: chatHistory },
    });

    // Broadcast arrival to new scene
    const playerState = this.sceneManager.getPlayerState(newScene, connection.playerName);
    if (playerState) {
      this.broadcastToScene(
        newScene,
        {
          type: 'PLAYER_JOINED',
          payload: {
            name: connection.playerName,
            position: playerState.position,
            currentScene: newScene,
            direction: playerState.direction,
            isFishing: false,
          },
        },
        connection.playerName
      );
    }
  }

  private async handleStartFishing(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName || !connection.currentScene) return;

    const playerState = this.sceneManager.getPlayerState(
      connection.currentScene,
      connection.playerName
    );
    if (!playerState) return;

    // Check if already fishing
    if (playerState.isFishing) {
      return;
    }

    // Check if player can fish from current position
    const canFish = this.sceneManager.canFishAtPosition(
      connection.currentScene,
      playerState.position,
      playerState.direction
    );

    if (!canFish) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Cannot fish here. Face water and try again.', code: 'CANNOT_FISH' },
      });
      return;
    }

    // Set fishing state
    this.sceneManager.setPlayerFishing(connection.currentScene, connection.playerName, true);

    // Broadcast fishing start
    this.broadcastToScene(connection.currentScene, {
      type: 'FISHING_START',
      payload: { name: connection.playerName },
    });

    // Simulate fishing delay (2-5 seconds)
    const fishingTime = 2000 + Math.random() * 3000;

    setTimeout(async () => {
      // Check if player is still connected and fishing
      const currentConnection = this.connections.get(connectionId);
      if (!currentConnection?.playerName || !currentConnection.currentScene) return;

      const currentState = this.sceneManager.getPlayerState(
        currentConnection.currentScene,
        currentConnection.playerName
      );
      if (!currentState?.isFishing) return;

      // Get player's pole level
      const player = await this.playerManager.get(currentConnection.playerName);
      const poleLevel = player?.poleLevel || 1;

      // Attempt catch with pole modifiers
      const result = this.fishingSystem.attemptCatch(currentConnection.currentScene, poleLevel);

      // Reset fishing state
      this.sceneManager.setPlayerFishing(currentConnection.currentScene, currentConnection.playerName, false);

      // Send result
      this.send(currentConnection.ws, {
        type: 'FISHING_RESULT',
        payload: result,
      });

      // Broadcast fishing end
      this.broadcastToScene(currentConnection.currentScene, {
        type: 'PLAYER_UPDATE',
        payload: {
          name: currentConnection.playerName,
          position: currentState.position,
          direction: currentState.direction,
          isFishing: false,
        },
      });

      if (result.success && result.fish) {
        // Add to player inventory
        const inventoryItem: InventoryItem = {
          id: uuid(),
          fishId: result.fish.id,
          fish: result.fish,
          caughtAt: new Date().toISOString(),
          caughtIn: currentConnection.currentScene,
        };

        const player = await this.playerManager.addToInventory(
          currentConnection.playerName,
          inventoryItem
        );

        if (player) {
          this.send(currentConnection.ws, {
            type: 'INVENTORY_UPDATE',
            payload: {
              inventory: player.inventory,
              money: player.money,
            },
          });
        }
      }
    }, fishingTime);
  }

  private async handleSellFish(
    connectionId: string,
    payload: { inventoryItemId: string }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName) return;

    const result = await this.playerManager.removeFromInventory(
      connection.playerName,
      payload.inventoryItemId
    );

    if (!result) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Item not found', code: 'ITEM_NOT_FOUND' },
      });
      return;
    }

    const { player, item } = result;

    // Add money
    const fishValue = item.fish.value;
    await this.playerManager.addMoney(connection.playerName, fishValue);

    // Get updated player
    const updatedPlayer = await this.playerManager.get(connection.playerName);
    if (updatedPlayer) {
      this.send(connection.ws, {
        type: 'INVENTORY_UPDATE',
        payload: {
          inventory: updatedPlayer.inventory,
          money: updatedPlayer.money,
        },
      });
    }
  }

  private async handleOpenShop(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName || !connection.currentScene) return;

    const playerState = this.sceneManager.getPlayerState(
      connection.currentScene,
      connection.playerName
    );
    if (!playerState) return;

    const scene = this.sceneManager.getScene(connection.currentScene);
    if (!scene) return;

    // Check if player is on or adjacent to a shop tile
    const nearShop = isAdjacentToTileType(scene.map, playerState.position, 'shop');
    if (!nearShop) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'You need to be near a shop to open it.', code: 'NOT_NEAR_SHOP' },
      });
      return;
    }

    // Get player data
    const player = await this.playerManager.get(connection.playerName);
    if (!player) return;

    const currentPole = getPole(player.poleLevel);
    const nextPole = getNextPole(player.poleLevel);

    const shopState: ShopState = {
      currentPole: {
        level: currentPole.level,
        name: currentPole.name,
        emoji: currentPole.emoji,
      },
      nextPole: nextPole ? {
        level: nextPole.level,
        name: nextPole.name,
        price: nextPole.price,
        description: nextPole.description,
        emoji: nextPole.emoji,
      } : null,
      canAfford: nextPole ? player.money >= nextPole.price : false,
      playerMoney: player.money,
    };

    this.send(connection.ws, {
      type: 'SHOP_OPENED',
      payload: shopState,
    });
  }

  private async handleBuyPoleUpgrade(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName) return;

    const player = await this.playerManager.get(connection.playerName);
    if (!player) return;

    const nextPole = getNextPole(player.poleLevel);
    if (!nextPole) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'You already have the best pole!', code: 'MAX_LEVEL' },
      });
      return;
    }

    if (player.money < nextPole.price) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Not enough money!', code: 'INSUFFICIENT_FUNDS' },
      });
      return;
    }

    const updatedPlayer = await this.playerManager.upgradePole(connection.playerName, nextPole.price);
    if (!updatedPlayer) {
      this.send(connection.ws, {
        type: 'ERROR',
        payload: { message: 'Failed to upgrade pole', code: 'UPGRADE_FAILED' },
      });
      return;
    }

    this.send(connection.ws, {
      type: 'PURCHASE_SUCCESS',
      payload: {
        poleLevel: updatedPlayer.poleLevel,
        money: updatedPlayer.money,
        poleName: nextPole.name,
        poleEmoji: nextPole.emoji,
      },
    });
  }

  private handleCloseShop(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.send(connection.ws, {
      type: 'SHOP_CLOSED',
      payload: {},
    });
  }

  private async handleSendChat(
    connectionId: string,
    payload: { message: string }
  ): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection?.playerName || !connection.currentScene) return;

    // Sanitize message
    const sanitizedMessage = payload.message.trim().slice(0, 200);
    if (!sanitizedMessage) return;

    // Store message in database
    const chatMessage = await this.chatManager.addMessage(
      connection.currentScene,
      connection.playerName,
      sanitizedMessage
    );

    // Broadcast to all players in scene (including sender)
    this.broadcastToScene(connection.currentScene, {
      type: 'CHAT_MESSAGE',
      payload: chatMessage,
    });
  }

  private handleDisconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log(`[GameServer] Disconnected: ${connectionId} (${connection.playerName || 'unknown'})`);

    if (connection.playerName && connection.currentScene) {
      // Get final position before removing
      const playerState = this.sceneManager.getPlayerState(
        connection.currentScene,
        connection.playerName
      );

      // Save final position
      if (playerState) {
        this.playerManager.updatePosition(
          connection.playerName,
          playerState.position,
          connection.currentScene
        );
      }

      // Remove from scene
      this.sceneManager.removePlayer(connection.currentScene, connection.playerName);

      // Broadcast departure
      this.broadcastToScene(connection.currentScene, {
        type: 'PLAYER_LEFT',
        payload: { name: connection.playerName },
      });

      this.playerConnections.delete(connection.playerName.toLowerCase());
    }

    this.connections.delete(connectionId);
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToScene(
    scene: SceneId,
    message: ServerMessage,
    excludePlayer?: string
  ): void {
    const players = this.sceneManager.getPlayerNames(scene);

    for (const playerName of players) {
      if (excludePlayer && playerName.toLowerCase() === excludePlayer.toLowerCase()) continue;

      const connectionId = this.playerConnections.get(playerName.toLowerCase());
      if (!connectionId) continue;

      const connection = this.connections.get(connectionId);
      if (connection) {
        this.send(connection.ws, message);
      }
    }
  }

  shutdown(): void {
    this.playerManager.shutdown();
    this.wss.close();
  }
}
