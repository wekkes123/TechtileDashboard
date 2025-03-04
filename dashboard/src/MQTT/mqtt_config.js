import mqtt from 'mqtt';

// Global MQTT settings
const BROKER_URL = "mqtt://test.mosquitto.org";
const OPTIONS = {
    clientId: `client_${Math.random().toString(16).slice(3)}`,
    clean: true,
};

// Create MQTT client
const client = mqtt.connect(BROKER_URL, OPTIONS);

// Export using ES6 syntax
export { client, BROKER_URL, OPTIONS };