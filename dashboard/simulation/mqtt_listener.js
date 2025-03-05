const { client } = require("../src/MQTT/mqtt_config2");

// Subscribe to topic
client.on("connect", () => {
    console.log("Listener connected, subscribing...");
    client.subscribe("rpi/data");
});

// Handle incoming messages
client.on("message", (topic, message) => {
    console.log(`Received on ${topic}:`, message.toString());
});
