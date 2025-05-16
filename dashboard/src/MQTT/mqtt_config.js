import * as mqtt from '../../node_modules/mqtt/dist/mqtt.min.js';

// Use WebSocket URL for the broker
const BROKER_URL = 'ws://10.128.48.5:8080/mqtt';

const options = {
    clientId: `client_${Math.random().toString(16).slice(3)}`,
    clean: true,
    reconnectPeriod: 1000, // Automatically reconnect after 1 second
    connectTimeout: 5000,  // 5 second timeout for connection
};

// Create MQTT client with WebSocket support
const client = mqtt.connect(BROKER_URL, options);

// Add error handling to prevent app from crashing
client.on('error', (err) => {
    console.error('MQTT Connection Error:', err);
});

// Optional: Add reconnect logic
client.on('reconnect', () => {
    console.log('Reconnecting to MQTT broker...');
});

export { client };