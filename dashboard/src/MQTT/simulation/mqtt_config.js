const mqtt = require("mqtt");

// Global MQTT settings
const BROKER_URL = "mqtt://test.mosquitto.org";
const OPTIONS = {
    clientId: `client_${Math.random().toString(16).slice(3)}`,
    clean: true,
};

// Create MQTT client
const client = mqtt.connect(BROKER_URL, OPTIONS);

// Export config
module.exports = { client, mqtt, BROKER_URL, OPTIONS };
