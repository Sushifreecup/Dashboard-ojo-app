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
    const dataCount = useRef(0);

    useEffect(() => {
        if (!videoRef.current || !audioRef.current) return;

        console.log(`[VideoPlayer] Init JMuxers for ${agentId} - ${streamType}`);

        // Video only JMuxer
        videoJmuxer.current = new JMuxer({
            node: videoRef.current,
            mode: 'video',
            flushingTime: 50,
            debug: false,
            onError: (err: any) => console.error(`[VideoJMuxer] error:`, err)
        });

        // Audio only JMuxer
        audioJmuxer.current = new JMuxer({
            node: audioRef.current,
            mode: 'audio',
            flushingTime: 50,
            debug: false,
            onError: (err: any) => console.error(`[AudioJMuxer] error:`, err)
        });

        const handleBinary = (e: any) => {
            const binaryData = e.detail;
            if (!binaryData || !videoJmuxer.current || !audioJmuxer.current) return;

            if (dataCount.current === 0) {
                console.log(`[VideoPlayer] First data packet received for ${agentId}`);
                setIsActive(true);
            }

            dataCount.current++;
            const typeByte = binaryData[0];
            const rawData = binaryData.slice(1);

            // Diagnostics for H.264
            if (typeByte === 1 || typeByte === 2) {
                // Check for NAL unit type (byte after 00 00 00 01)
                let nalType = -1;
                if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 0 && rawData[3] === 1) {
                    nalType = rawData[4] & 0x1F;
                } else if (rawData[0] === 0 && rawData[1] === 0 && rawData[2] === 1) {
                    nalType = rawData[3] & 0x1F;
                }

                if (nalType === 7 || nalType === 8 || nalType === 5) {
                    console.log(`[VideoPlayer] Received Critical NAL Unit: ${nalType} (7:SPS, 8:PPS, 5:IDR) for ${agentId}`);
                }
            }

            // Feed to appropriate JMuxer
            // 0x01: Screen, 0x02: Camera, 0x03: Audio
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
            console.log(`[VideoPlayer] Cleaning up JMuxers for ${agentId}`);
            window.removeEventListener(`agent-data-${agentId}`, handleBinary);
            if (videoJmuxer.current) videoJmuxer.current.destroy();
            if (audioJmuxer.current) audioJmuxer.current.destroy();
            videoJmuxer.current = null;
            audioJmuxer.current = null;
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
                    style={{ background: '#000', display: 'block', width: '100%', height: '100%' }}
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
