import { createServer, IncomingMessage } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { GameServer } from './GameServer';
import { Duplex } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectDir = path.resolve(__dirname, '..');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port, dir: projectDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server with noServer mode to avoid conflicts with Next.js HMR
  const wss = new WebSocketServer({ noServer: true });

  // Initialize game server
  const gameServer = new GameServer(wss);
  gameServer.start();

  // Handle WebSocket upgrades manually - only upgrade /ws path
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = parse(request.url || '');

    if (pathname === '/ws') {
      // Handle game WebSocket connections
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Let Next.js handle other WebSocket upgrades (HMR, etc.)
      // Don't destroy the socket - just don't handle it
      // Next.js will handle /_next/webpack-hmr automatically
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('[Server] Error:', error);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    gameServer.shutdown();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    gameServer.shutdown();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server on ws://${hostname}:${port}/ws`);
  });
});
