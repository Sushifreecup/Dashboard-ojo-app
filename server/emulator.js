const WebSocket = require('ws');

const AGENT_ID = 'Agent_Emulator_01';
const ws = new WebSocket(`ws://localhost:8080?role=agent&id=${AGENT_ID}`);

ws.on('open', () => {
    console.log(`✅ Emulator connected as ${AGENT_ID}`);

    // Simulate streaming
    let frame = 0;
    setInterval(() => {
        // Send dummy "Screen" data (0x01)
        const dummyData = Buffer.alloc(100);
        dummyData[0] = 0x01; // Type: Screen
        // Fill with random bytes to simulate data
        for (let i = 1; i < 100; i++) dummyData[i] = Math.floor(Math.random() * 256);

        ws.send(dummyData);
        frame++;
        if (frame % 60 === 0) console.log(`Streaming frames... (${frame})`);
    }, 1000 / 30); // 30 FPS
});

ws.on('message', (message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log(`📩 Command received:`, data.cmd);
    } catch (e) { }
});

ws.on('close', () => console.log('❌ Emulator disconnected'));
