# Android Telemetry System

A real-time telemetry system featuring a Node.js WebSocket server and a React-based monitoring dashboard.

## Features
- **Real-time Video/Audio Streaming**: Supports H.264 video and AAC audio.
- **Multi-Agent Management**: Monitor multiple agents simultaneously from a single dashboard.
- **Remote Control**: Send commands (`screen_on`, `cam_on`, `mic_on`, `all_off`) to agents.
- **Modern Dashboard**: Dark mode UI with a responsive grid layout.

## Project Structure
- `/server`: Node.js WebSocket server.
- `/dashboard`: React (Vite + TypeScript) monitoring interface.

## Quick Start

### Server
1. Navigate to `server/`.
2. Run `npm install`.
3. Start with `node index.js`.

### Dashboard
1. Navigate to `dashboard/`.
2. Run `npm install`.
3. Start with `npm run dev`.

## Protocol
- **Port**: 8080 (WS)
- **Binary Header**: First byte indicates data type (0x01: Screen, 0x02: Camera, 0x03: Audio).
