import React, { useEffect, useRef, useState } from 'react';
import JMuxer from 'jmuxer';

interface VideoPlayerProps {
    streamType: 'screen' | 'camera' | 'audio';
    agentId: string;
    binaryData: Uint8Array | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamType, agentId, binaryData }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const jmuxerRef = useRef<any>(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!videoRef.current) return;

        jmuxerRef.current = new JMuxer({
            node: streamType === 'audio' ? audioRef.current : videoRef.current,
            mode: streamType === 'audio' ? 'audio' : 'both',
            flushingTime: 0,
            debug: false,
            onError: (err: any) => {
                console.error('JMuxer error:', err);
            }
        });

        return () => {
            if (jmuxerRef.current) {
                jmuxerRef.current.destroy();
                jmuxerRef.current = null;
            }
        };
    }, [streamType]);

    useEffect(() => {
        if (binaryData && jmuxerRef.current) {
            setIsActive(true);
            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            // 0x01: Screen, 0x02: Camera, 0x03: Audio
            if (typeByte === 1 && streamType === 'screen') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 2 && streamType === 'camera') {
                jmuxerRef.current.feed({ video: rawData });
            } else if (typeByte === 3 && (streamType === 'audio' || streamType === 'camera' || streamType === 'screen')) {
                // In our case we feed audio to whichever is active or a separate audio player
                jmuxerRef.current.feed({ audio: rawData });
            }
        }
    }, [binaryData, streamType]);

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
