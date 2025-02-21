const mqtt = require('mqtt');

const BROKER_URL = "mqtt://test.mosquitto.org";
const client = mqtt.connect(BROKER_URL);

const TOPIC = "raspberrypi/monitoring";

// Connect and subscribe
client.on('connect', () => {
    console.log("Connected to MQTT broker, subscribing to", TOPIC);
    client.subscribe(TOPIC);
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received data: ${message.toString()}`);
});

client.on('error', (err) => {
    console.error("MQTT Error:", err);
});
