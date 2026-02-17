import React, { useEffect, useState, useRef } from 'react';
import AgentCard from './components/AgentCard';
import { LayoutGrid, Radio, Smartphone } from 'lucide-react';

interface AgentData {
    id: string;
}

const App: React.FC = () => {
    const [agents, setAgents] = useState<Record<string, AgentData>>({});
    const [connected, setConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const connect = () => {
            const wsHost = import.meta.env.VITE_WS_URL || `${window.location.hostname}:8080`;
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            const socket = new WebSocket(`${protocol}://${wsHost}?role=dashboard`);
            socket.binaryType = 'arraybuffer';

            socket.onopen = () => {
                console.log('Connected to server');
                setConnected(true);
            };

            socket.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    const data = JSON.parse(event.data);

                    if (data.type === 'init') {
                        const initialAgents: Record<string, AgentData> = {};
                        data.agents.forEach((id: string) => {
                            initialAgents[id] = { id };
                        });
                        setAgents(initialAgents);
                    } else if (data.type === 'agent_online') {
                        setAgents(prev => ({
                            ...prev,
                            [data.id]: { id: data.id }
                        }));
                    } else if (data.type === 'agent_offline') {
                        setAgents(prev => {
                            const newAgents = { ...prev };
                            delete newAgents[data.id];
                            return newAgents;
                        });
                    }
                } else {
                    // Binary handling
                    const buffer = new Uint8Array(event.data);
                    const idLength = buffer[0];
                    const agentIdHeader = new TextDecoder().decode(buffer.slice(1, 1 + idLength)).trim();
                    const rawBinary = buffer.slice(1 + idLength);

                    if (Math.random() < 0.01) { // Log 1% of packets to avoid flooding
                        console.log(`[App] Recv binary from: "${agentIdHeader}" (len: ${rawBinary.length})`);
                    }

                    // Dispatch event for the specific agent
                    window.dispatchEvent(new CustomEvent(`agent-data-${agentIdHeader}`, { detail: rawBinary }));
                }
            };

            socket.onclose = () => {
                console.log('Disconnected from server, retrying...');
                setConnected(false);
                setTimeout(connect, 3000);
            };

            ws.current = socket;
        };

        connect();
        return () => ws.current?.close();
    }, []);

    const sendCommand = (target: string, cmd: string) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ target, cmd }));
        }
    };

    const agentList = Object.values(agents);

    return (
        <div className="dashboard-container">
            <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="status-badge" style={{ padding: '0.75rem', borderRadius: '0.75rem' }}>
                        <Radio size={24} className={connected ? 'text-success' : 'text-danger'} />
                    </div>
                    <div>
                        <h1>Android Telemetry</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {connected ? 'Real-time connection active' : 'Connecting to server...'}
                        </p>
                    </div>
                </div>

                <div className="status-badge">
                    <LayoutGrid size={18} />
                    <span>{agentList.length} Agents Active</span>
                </div>
            </header>

            <main>
                {agentList.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: 'var(--text-secondary)' }}>
                        <Smartphone size={48} style={{ opacity: 0.2 }} />
                        <p>No agents connected yet. Start an agent to begin monitoring.</p>
                    </div>
                ) : (
                    <div className="agents-grid">
                        {agentList.map(agent => (
                            <AgentCard
                                key={agent.id}
                                id={agent.id}
                                onSendCommand={sendCommand}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
