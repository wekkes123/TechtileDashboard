const mqtt = require("mqtt");

// Global MQTT settings
const BROKER_URL = "mqtt://10.128.48.5";
const OPTIONS = {
    clientId: `client_${Math.random().toString(16).slice(3)}`,
    clean: true,
};

// Create MQTT client
const client = mqtt.connect(BROKER_URL, OPTIONS);

// Export config
module.exports = { client, mqtt, BROKER_URL, OPTIONS };
