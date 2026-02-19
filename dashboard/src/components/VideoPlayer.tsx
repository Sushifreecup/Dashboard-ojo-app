import React, { useEffect, useRef, useState } from 'react';
import JMuxer from 'jmuxer';
import { Maximize, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
    streamType: 'screen' | 'camera' | 'audio';
    agentId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamType, agentId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoMuxer = useRef<any>(null);
    const audioMuxer = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isActive, setIsActive] = useState(false);
    const [stats, setStats] = useState({ width: 0, height: 0 });
    const dataCount = useRef(0);

    const initMuxers = () => {
        if (!videoRef.current || !audioRef.current) return;

        console.log(`[VideoPlayer] Initializing JMuxers for ${agentId} (${streamType})`);

        videoMuxer.current = new JMuxer({
            node: videoRef.current,
            mode: 'video',
            flushingTime: streamType === 'screen' ? 500 : 10,
            debug: false,
            onError: (err: any) => console.error(`[VideoMuxer] error:`, err)
        });

        audioMuxer.current = new JMuxer({
            node: audioRef.current,
            mode: 'audio',
            flushingTime: 10,
            debug: false,
            onError: (err: any) => console.error(`[AudioMuxer] error:`, err)
        });
    };

    useEffect(() => {
        initMuxers();

        const handleBinary = (e: any) => {
            const binaryData = e.detail;
            if (!binaryData || !videoMuxer.current || !audioMuxer.current) return;

            if (dataCount.current === 0) {
                setIsActive(true);
                videoRef.current?.play().catch(() => { });
                audioRef.current?.play().catch(() => { });
            }

            dataCount.current++;
            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            // Diagnósticos de H.264 para mostrar resolución
            if (typeByte === 1 || typeByte === 2) {
                let nalType = -1;
                if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 0 && rawData[3] === 1) {
                    nalType = rawData[4] & 0x1F;
                } else if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 1) {
                    nalType = rawData[3] & 0x1F;
                }

                if (nalType === 7 || nalType === 8 || nalType === 5) {
                    if (videoRef.current && videoRef.current.videoWidth > 0 && stats.width === 0) {
                        setStats({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
                    }
                }
            }

            if (typeByte === 1 && streamType === 'screen') {
                videoMuxer.current.feed({ video: rawData });
            } else if (typeByte === 2 && streamType === 'camera') {
                videoMuxer.current.feed({ video: rawData });
            } else if (typeByte === 3) {
                // El audio siempre se alimenta al muxer de audio
                audioMuxer.current.feed({ audio: rawData });
            }
        };

        window.addEventListener(`agent-data-${agentId}`, handleBinary);

        return () => {
            window.removeEventListener(`agent-data-${agentId}`, handleBinary);
            if (videoMuxer.current) videoMuxer.current.destroy();
            if (audioMuxer.current) audioMuxer.current.destroy();
            videoMuxer.current = null;
            audioMuxer.current = null;
        };
    }, [streamType, agentId]);

    const resetStream = () => {
        dataCount.current = 0;
        setIsActive(false);
        setStats({ width: 0, height: 0 });
        if (videoMuxer.current) videoMuxer.current.destroy();
        if (audioMuxer.current) audioMuxer.current.destroy();
        initMuxers();
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handleInteraction = () => {
        videoRef.current?.play().catch(() => { });
        audioRef.current?.play().catch(() => { });
        console.log('[VideoPlayer] User interaction: triggered play on video and audio');
    };

    return (
        <div
            className="video-container"
            ref={containerRef}
            onClick={handleInteraction}
            style={{ position: 'relative', background: 'black', cursor: 'pointer' }}
        >
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                    background: '#000',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: streamType === 'audio' ? 'none' : 'block'
                }}
            />
            <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

            {streamType === 'audio' && (
                <div className="audio-visual" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="status-badge" style={{ background: isActive ? 'var(--success)' : '#1e1e21' }}>
                        {isActive ? 'Audio Streaming' : 'Audio Inactive'}
                    </div>
                </div>
            )}

            {!isActive && (
                <div className="placeholder-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                    Waiting for {streamType} stream...
                </div>
            )}

            {isActive && streamType !== 'audio' && (
                <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="status-badge" style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                            {stats.width > 0 ? `${stats.width}x${stats.height}` : 'Decoding...'}
                        </div>
                        <button
                            onClick={resetStream}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                            title="Reset Stream"
                        >
                            <RefreshCw size={12} />
                        </button>
                        <div className="status-dot online" style={{ width: 8, height: 8 }}></div>
                    </div>

                    <button
                        onClick={toggleFullscreen}
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '4px', borderRadius: '4px', cursor: 'pointer', display: 'flex' }}
                        title="Fullscreen"
                    >
                        <Maximize size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
