import React, { useState } from 'react';
import { Monitor, Camera, Mic, PowerOff, Smartphone } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface AgentCardProps {
    id: string;
    onSendCommand: (id: string, cmd: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ id, onSendCommand }) => {
    const [activeTab, setActiveTab] = useState<'screen' | 'camera' | 'audio'>('screen');
    const [screenOn, setScreenOn] = useState(false);
    const [camOn, setCamOn] = useState<false | 'front' | 'back'>(false);
    const [micOn, setMicOn] = useState(false);

    const toggleScreen = () => {
        if (screenOn) {
            onSendCommand(id, 'screen_off');
            setScreenOn(false);
        } else {
            onSendCommand(id, 'screen_on');
            setScreenOn(true);
        }
    };

    const toggleCam = (facing: 'front' | 'back') => {
        if (camOn === facing) {
            onSendCommand(id, 'cam_off');
            setCamOn(false);
        } else {
            onSendCommand(id, facing === 'front' ? 'cam_front' : 'cam_back');
            setCamOn(facing);
        }
    };

    const toggleMic = () => {
        if (micOn) {
            onSendCommand(id, 'mic_off');
            setMicOn(false);
        } else {
            onSendCommand(id, 'mic_on');
            setMicOn(true);
        }
    };

    const allOff = () => {
        onSendCommand(id, 'all_off');
        setScreenOn(false);
        setCamOn(false);
        setMicOn(false);
    };

    const onStyle = { background: '#22c55e', color: '#000', fontWeight: 700 } as React.CSSProperties;
    const offStyle = {} as React.CSSProperties;

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
            />

            <div className="agent-controls" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                    className="btn"
                    style={screenOn ? { ...onStyle, width: '100%' } : { width: '100%' }}
                    onClick={toggleScreen}
                >
                    <Monitor size={18} />
                    <div className="status-dot" style={{ background: screenOn ? '#fff' : '#4b5563', opacity: 0.6 }}></div>
                    {screenOn ? 'Screen ON' : 'Screen OFF'}
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn"
                        style={camOn === 'back' ? { ...onStyle, flex: 1 } : { flex: 1 }}
                        onClick={() => toggleCam('back')}
                    >
                        <Camera size={16} style={{ opacity: 0.7 }} />
                        <div className="status-dot" style={{ background: camOn === 'back' ? '#fff' : '#4b5563', opacity: 0.6 }}></div>
                        Cam Back
                    </button>
                    <button
                        className="btn"
                        style={camOn === 'front' ? { ...onStyle, flex: 1 } : { flex: 1 }}
                        onClick={() => toggleCam('front')}
                    >
                        <Camera size={16} style={{ opacity: 0.7 }} />
                        <div className="status-dot" style={{ background: camOn === 'front' ? '#fff' : '#4b5563', opacity: 0.6 }}></div>
                        Cam Front
                    </button>
                </div>

                <button
                    className="btn"
                    style={micOn ? { ...onStyle, width: '100%' } : { width: '100%' }}
                    onClick={toggleMic}
                >
                    <Mic size={18} />
                    <div className="status-dot" style={{ background: micOn ? '#fff' : '#4b5563', opacity: 0.6 }}></div>
                    {micOn ? 'Mic ON' : 'Mic OFF'}
                </button>

                <button className="btn" style={{ width: '100%' }} onClick={allOff}>
                    <PowerOff size={18} style={{ opacity: 0.7 }} />
                    <div className="status-dot" style={{ background: '#ef4444' }}></div>
                    All OFF
                </button>
            </div>
        </div>
    );
};

export default AgentCard;
