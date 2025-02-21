const mqtt = require('mqtt');

// Connect to the public test MQTT broker
const BROKER_URL = "mqtt://test.mosquitto.org";
const client = mqtt.connect(BROKER_URL);

const TOPIC = "raspberrypi/monitoring";

// Function to generate fake data
function generateData() {
    return {
        id: Math.floor(Math.random() * 140) + 1, // Simulated Pi ID (1-140)
        cpu_temp: (40 + Math.random() * 20).toFixed(2), // Fake CPU temp (40-60°C)
        uptime: Math.floor(Math.random() * 10000), // Fake uptime in seconds
        psu_wattage: (5 + Math.random() * 15).toFixed(2) // Fake PSU wattage (5-20W)
    };
}

// Publish data every 5 seconds
client.on('connect', () => {
    console.log("Connected to MQTT broker");

    setInterval(() => {
        const data = generateData();
        client.publish(TOPIC, JSON.stringify(data));
        console.log(`Published: ${JSON.stringify(data)}`);
    }, 5000);
});

client.on('error', (err) => {
    console.error("MQTT Error:", err);
});
