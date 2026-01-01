import { createServer, IncomingMessage } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { GameServer } from './GameServer';
import { Duplex } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Socket } from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port, dir: projectDir });
const handle = app.getRequestHandler();

// Track all active sockets for forced shutdown
const activeSockets = new Set<Socket>();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Track connections for cleanup
  server.on('connection', (socket: Socket) => {
    activeSockets.add(socket);
    socket.on('close', () => {
      activeSockets.delete(socket);
    });
  });

  // Create WebSocket server with noServer mode to avoid conflicts with Next.js HMR
  const wss = new WebSocketServer({ noServer: true });

  // Initialize game server
  const gameServer = new GameServer(wss);
  gameServer.start();

  // Store Next.js upgrade listeners that were added during prepare()
  const existingUpgradeListeners = server.listeners('upgrade').slice();

  // Handle WebSocket upgrades manually - only upgrade /ws path
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = parse(request.url || '');

    if (pathname === '/ws') {
      // Handle game WebSocket connections
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname?.startsWith('/_next/')) {
      // Let Next.js handle its internal WebSocket connections (HMR, Turbopack, etc.)
      // Call existing listeners that Next.js may have registered
      for (const listener of existingUpgradeListeners) {
        listener.call(server, request, socket, head);
      }
    } else {
      // Unknown WebSocket path - destroy the socket to prevent hanging
      socket.destroy();
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('[Server] Error:', error);
  });

  // Graceful shutdown function
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);

    // Set a hard timeout - force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      console.log('Graceful shutdown timed out, forcing exit...');
      process.exit(1);
    }, 5000);

    // Close all WebSocket connections explicitly
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(1001, 'Server shutting down');
      }
      client.terminate();
    });

    // Shutdown game server (saves player data, clears intervals)
    gameServer.shutdown();

    // Close WebSocket server
    wss.close(() => {
      console.log('WebSocket server closed');
    });

    // Destroy all active sockets to allow server.close() to complete
    for (const socket of activeSockets) {
      socket.destroy();
    }
    activeSockets.clear();

    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      clearTimeout(forceExitTimeout);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server on ws://${hostname}:${port}/ws`);
  });
});
