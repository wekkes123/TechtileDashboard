const { client } = require("../src/MQTT/mqtt_config2");

// Subscribe to topics
client.on("connect", () => {
    console.log("Listener connected, subscribing...");

    // Subscribe to RPi data topics
    client.subscribe("rpi/data", (err) => {
        if (err) console.error("Failed to subscribe to rpi/data:", err);
        else console.log("Subscribed to rpi/data");
    });

    // Subscribe to PDU data topics
    client.subscribe("pdu/data", (err) => {
        if (err) console.error("Failed to subscribe to pdu/data:", err);
        else console.log("Subscribed to pdu/data");
    });

    // Subscribe to Midspan data topics
    client.subscribe("midspan/data", (err) => {
        if (err) console.error("Failed to subscribe to midspan/data:", err);
        else console.log("Subscribed to midspan/data");
    });

    // Subscribe to Time Provider data topics
    client.subscribe("timeprovider/data", (err) => {
        if (err) console.error("Failed to subscribe to timeprovider/data:", err);
        else console.log("Subscribed to timeprovider/data");
    });
});

// Handle incoming messages
client.on("message", (topic, message) => {
    console.log(`Received on ${topic}:`, message.toString());
});
