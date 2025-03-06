const { client } = require("../src/MQTT/mqtt_config2");

let piStatus = {}; // Store simulated Pi states

function publishMockData() {
    const interval = 500; // Adjust the speed (milliseconds)
    setInterval(() => {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
        const number = Math.floor(Math.random() * 20) + 1; // 1-20
        const id = `${letter}${number}`;

        // If the Pi has no status yet, assume it's "on"
        if (!(id in piStatus)) piStatus[id] = "1";

        const data = {
            id,
            temp: (Math.random() * 20 + 40).toFixed(2),
            status: piStatus[id], // Use stored status
        };

        client.publish("rpi/data", JSON.stringify(data));
        console.log("Published:", data);
    }, interval);
}

// Handle power control messages
client.on("message", (topic, message) => {
    if (topic === "rpi/control") {
        const { id, command } = JSON.parse(message.toString());
        if (piStatus[id] !== undefined) {
            piStatus[id] = command === "on" ? "1" : "0"; // Update status
            console.log(`Pi ${id} is now ${command.toUpperCase()}`);
        }
    }
});

// Run when connected
client.on("connect", () => {
    console.log("Mock Pis connected to MQTT!");
    client.subscribe("rpi/control"); // Listen for control messages
    publishMockData();
});
