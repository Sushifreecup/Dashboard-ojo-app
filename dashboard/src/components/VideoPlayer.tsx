import React, { useEffect, useRef, useState } from 'react';
import JMuxer from 'jmuxer';

interface VideoPlayerProps {
    streamType: 'screen' | 'camera' | 'audio';
    agentId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamType, agentId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const jmuxerRef = useRef<any>(null);
    const [isActive, setIsActive] = useState(false);
    const dataCount = useRef(0);

    useEffect(() => {
        if (!videoRef.current && !audioRef.current) return;

        console.log(`[VideoPlayer] Init JMuxer for ${agentId} - ${streamType}`);

        jmuxerRef.current = new JMuxer({
            node: streamType === 'audio' ? audioRef.current : videoRef.current,
            mode: streamType === 'audio' ? 'audio' : 'both',
            flushingTime: 100, // Increased for better stability
            debug: false,
            onError: (err: any) => {
                console.error(`[JMuxer] error on ${agentId}:`, err);
            }
        });

        const handleBinary = (e: any) => {
            const binaryData = e.detail;
            if (!binaryData || !jmuxerRef.current) return;

            if (dataCount.current === 0) {
                console.log(`[VideoPlayer] First data packet received for ${agentId}`);
                setIsActive(true);
            }

            dataCount.current++;
            if (dataCount.current % 100 === 0) {
                console.log(`[VideoPlayer] Received 100 packets for ${agentId} (${streamType})`);
            }

            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            if (dataCount.current === 1) {
                const hex = Array.from(rawData.slice(0, 5)).map((b: any) => b.toString(16).padStart(2, '0')).join(' ');
                console.log(`[VideoPlayer] First bytes of raw data (${typeByte}): ${hex}`);
            }
            if (typeByte === 1 && streamType === 'screen') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 2 && streamType === 'camera') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 3) {
                jmuxerRef.current.feed({ audio: rawData });
            }
        };

        window.addEventListener(`agent-data-${agentId}`, handleBinary);

        return () => {
            console.log(`[VideoPlayer] Cleaning up for ${agentId}`);
            window.removeEventListener(`agent-data-${agentId}`, handleBinary);
            if (jmuxerRef.current) {
                jmuxerRef.current.destroy();
                jmuxerRef.current = null;
            }
        };
    }, [streamType, agentId]);

    return (
        <div className="video-container">
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
                    style={{ background: '#000', display: isActive ? 'block' : 'block' }}
                />
            )}
            <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

            {!isActive && (
                <div className="placeholder-text" style={{ position: 'absolute', zIndex: 10 }}>
                    Waiting for {streamType} stream... ({agentId})
                </div>
            )}
            {isActive && streamType !== 'audio' && (
                <div className="status-badge" style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.6rem', opacity: 0.5 }}>
                    Receiving Data...
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
