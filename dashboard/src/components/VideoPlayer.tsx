import React, { useEffect, useRef, useState } from 'react';
import JMuxer from 'jmuxer';

interface VideoPlayerProps {
    streamType: 'screen' | 'camera' | 'audio';
    agentId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamType, agentId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoJmuxer = useRef<any>(null);
    const audioJmuxer = useRef<any>(null);
    const [isActive, setIsActive] = useState(false);
    const [stats, setStats] = useState({ width: 0, height: 0 });
    const dataCount = useRef(0);

    const initMuxers = () => {
        if (!videoRef.current || !audioRef.current) return;

        console.log(`[VideoPlayer] Initializing JMuxers for ${agentId}`);

        videoJmuxer.current = new JMuxer({
            node: videoRef.current,
            mode: 'video',
            flushingTime: streamType === 'screen' ? 100 : 10,
            debug: false,
            onError: (err: any) => console.error(`[VideoJMuxer] error:`, err)
        });

        audioJmuxer.current = new JMuxer({
            node: audioRef.current,
            mode: 'audio',
            flushingTime: 10,
            debug: false,
            onError: (err: any) => console.error(`[AudioJMuxer] error:`, err)
        });
    };

    useEffect(() => {
        initMuxers();

        const handleBinary = (e: any) => {
            const binaryData = e.detail;
            if (!binaryData || !videoJmuxer.current || !audioJmuxer.current) return;

            if (dataCount.current === 0) {
                setIsActive(true);
                // Force play in case browser blocked it
                videoRef.current?.play().catch(() => { });
            }

            dataCount.current++;
            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            // Diagnostics for H.264
            if (typeByte === 1 || typeByte === 2) {
                let nalType = -1;
                if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 0 && rawData[3] === 1) {
                    nalType = rawData[4] & 0x1F;
                } else if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 1) {
                    nalType = rawData[3] & 0x1F;
                }

                if (nalType === 7 || nalType === 8 || nalType === 5) {
                    // SPS/PPS/IDR found
                    if (videoRef.current && videoRef.current.videoWidth > 0 && stats.width === 0) {
                        setStats({ width: videoRef.current.videoWidth, height: videoRef.current.videoHeight });
                    }
                }
            }

            if (typeByte === 1 && streamType === 'screen') {
                videoJmuxer.current.feed({ video: rawData });
            } else if (typeByte === 2 && streamType === 'camera') {
                videoJmuxer.current.feed({ video: rawData });
            } else if (typeByte === 3) {
                audioJmuxer.current.feed({ audio: rawData });
            }
        };

        window.addEventListener(`agent-data-${agentId}`, handleBinary);

        return () => {
            window.removeEventListener(`agent-data-${agentId}`, handleBinary);
            if (videoJmuxer.current) videoJmuxer.current.destroy();
            if (audioJmuxer.current) audioJmuxer.current.destroy();
            videoJmuxer.current = null;
            audioJmuxer.current = null;
        };
    }, [streamType, agentId]);

    const resetStream = () => {
        dataCount.current = 0;
        setIsActive(false);
        setStats({ width: 0, height: 0 });
        if (videoJmuxer.current) videoJmuxer.current.destroy();
        if (audioJmuxer.current) audioJmuxer.current.destroy();
        initMuxers();
    };

    return (
        <div className="video-container" style={{ position: 'relative' }}>
            {streamType === 'audio' ? (
                <div className="audio-visual">
                    <div className="status-badge" style={{ background: isActive ? 'var(--success)' : '#1e1e21' }}>
                        {isActive ? 'Audio Streaming' : 'Audio Inactive'}
                    </div>
                </div>
            ) : (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ background: '#000', width: '100%', height: '100%', objectFit: 'contain' }}
                />
            )}
            <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

            {!isActive && (
                <div className="placeholder-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
                    Waiting for {streamType} stream...
                </div>
            )}

            {isActive && streamType !== 'audio' && (
                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 20 }}>
                    <div className="status-badge" style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                        {stats.width > 0 ? `${stats.width}x${stats.height}` : 'Decoding...'}
                    </div>
                    <button
                        onClick={resetStream}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem' }}
                    >
                        Reset
                    </button>
                    <div className="status-dot online" style={{ width: 8, height: 8 }}></div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
