# Fishing Game - Development Guide

A multiplayer browser-based fishing game built with Next.js 16, WebSockets, and React 19.

## Quick Start

```bash
pnpm run dev    # Start the game server (Next.js + WebSocket)
```

Open http://localhost:3000 to play.

## Architecture Overview

```
┌─────────────────────┐     ┌─────────────────────┐
│   Next.js App       │     │  WebSocket Server   │
│   (Port 3000)       │     │  (same process)     │
│  - React UI         │◄───►│  - GameServer       │
│  - Static Assets    │     │  - Real-time sync   │
└─────────────────────┘     └─────────────────────┘
```

The custom server (`server/index.ts`) runs both Next.js and a WebSocket server on port 3000. The WebSocket endpoint is at `/ws`.

## Project Structure

```
fishing-game/
├── server/                    # WebSocket game server
│   ├── index.ts               # Entry point (Next.js + WS)
│   ├── GameServer.ts          # Connection & message handling
│   ├── SceneManager.ts        # Per-scene player state
│   ├── PlayerManager.ts       # Persistence & caching
│   └── FishingSystem.ts       # Catch probability logic
│
├── lib/
│   ├── types/index.ts         # All TypeScript interfaces
│   ├── hooks/
│   │   ├── useWebSocket.ts    # WS connection management
│   │   └── useKeyboard.ts     # Arrow key input handling
│   └── utils/
│       ├── collision.ts       # Tile collision detection
│       ├── mapParser.ts       # JSON scene loading
│       └── yaml.ts            # YAML fish config loading
│
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx     # Main SVG game renderer
│   │   ├── TileMap.tsx        # Renders tile grid
│   │   └── Player.tsx         # Player avatar with direction
│   └── ui/
│       ├── LoginForm.tsx      # Name entry + scene selection
│       ├── Inventory.tsx      # Fish list with sell buttons
│       ├── SceneSelector.tsx  # Location switching
│       ├── PlayerList.tsx     # Online players display
│       └── CatchModal.tsx     # Fish caught notification
│
├── store/
│   └── gameStore.ts           # Zustand client state
│
├── data/
│   ├── fish/                  # YAML fish definitions
│   │   ├── pond.yaml
│   │   ├── swamp.yaml
│   │   ├── river.yaml
│   │   └── ocean.yaml
│   └── scenes/                # JSON tile maps
│       ├── pond.json
│       ├── swamp.json
│       ├── river.json
│       └── ocean.json
│
├── persistence/
│   └── players.json           # Player save data
│
└── app/
    └── page.tsx               # Main game page (client component)
```

## Key Concepts

### Scenes (4 locations)
Each scene has a 16x12 tile map defined in `data/scenes/*.json`. Tiles have properties:
- `type`: grass, water, dirt, sand, rock, mud, dock, deep_water
- `walkable`: Can player stand here?
- `fishable`: Can player catch fish from here?

### Fish Configuration
Fish are defined in `data/fish/*.yaml` with:
- `id`: Unique identifier
- `name`: Display name
- `rarity`: common | uncommon | rare | epic | legendary
- `catchChance`: Percentage (0-100)
- `value`: Cash when sold
- `emoji`: Visual representation
- `description`: Flavor text

### WebSocket Messages

**Client → Server:**
- `JOIN` - Enter game with name + scene
- `MOVE` - Position + direction update
- `CHANGE_SCENE` - Switch locations
- `START_FISHING` - Cast fishing rod
- `SELL_FISH` - Sell inventory item

**Server → Client:**
- `WELCOME` - Player data + scene info
- `SCENE_STATE` - All players in scene
- `PLAYER_JOINED/LEFT` - Multiplayer updates
- `PLAYER_UPDATE` - Position sync
- `FISHING_RESULT` - Catch outcome
- `INVENTORY_UPDATE` - Inventory/money changes

### Player Persistence
Players are identified by name (case-insensitive). Data stored in `persistence/players.json`:
- Inventory (caught fish)
- Money
- Last scene and position
- Timestamps

## Controls

- **Arrow Keys / WASD**: Move player
- **Space / F**: Cast fishing rod (when near water)
- Click inventory items to sell

## Adding New Fish

Edit `data/fish/{scene}.yaml`:

```yaml
- id: my_new_fish
  name: My New Fish
  rarity: rare
  catchChance: 5
  value: 200
  emoji: "🐟"
  description: "A very special fish."
```

Restart the server to load changes.

## Adding New Scenes

1. Create `data/scenes/newscene.json` with tile map
2. Create `data/fish/newscene.yaml` with fish
3. Add scene ID to `SceneId` type in `lib/types/index.ts`
4. Add scene to UI in `components/ui/SceneSelector.tsx` and `LoginForm.tsx`

## Development Notes

- Server state is authoritative; clients render server state
- Fishing has 2-5 second random delay before catch result
- Player positions are saved periodically (30s) and on disconnect
- Fish catch probability uses cumulative distribution

## Dependencies

- `ws`: WebSocket server
- `yaml`: Fish config parsing
- `zustand`: Client state management
- `uuid`: Unique IDs for inventory items
- `tsx`: TypeScript execution for custom server
