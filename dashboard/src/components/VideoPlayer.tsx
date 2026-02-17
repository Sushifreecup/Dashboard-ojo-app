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

    useEffect(() => {
        if (!videoRef.current && !audioRef.current) return;

        jmuxerRef.current = new JMuxer({
            node: streamType === 'audio' ? audioRef.current : videoRef.current,
            mode: streamType === 'audio' ? 'audio' : 'both',
            flushingTime: 0,
            debug: false,
            onError: (err: any) => {
                console.error('JMuxer error:', err);
            }
        });

        const handleBinary = (e: any) => {
            const binaryData = e.detail;
            if (!binaryData || !jmuxerRef.current) return;

            setIsActive(true);
            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            // 0x01: Screen, 0x02: Camera, 0x03: Audio
            if (typeByte === 1 && streamType === 'screen') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 2 && streamType === 'camera') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 3) {
                // Feed audio regardless of current view if it's audio data
                jmuxerRef.current.feed({ audio: rawData });
            }
        };

        window.addEventListener(`agent-data-${agentId}`, handleBinary);

        return () => {
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
                <video ref={videoRef} autoPlay muted playsInline />
            )}
            <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

            {!isActive && (
                <div className="placeholder-text" style={{ position: 'absolute' }}>
                    Waiting for {streamType} stream...
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
