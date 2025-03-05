const { client } = require("../src/MQTT/mqtt_config2");

function publishMockData() {
    const interval = 500; // Adjust this value to slow down or speed up (milliseconds)
    setInterval(() => {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
        const number = Math.floor(Math.random() * 20) + 1; // 1-20

        const data = {
            id: `${letter}${number}`,
            temp: (Math.random() * 20 + 40).toFixed(2),
            status: Math.random() > 0.1 ? "1" : "0",
        };

        client.publish("rpi/data", JSON.stringify(data));
        console.log("Published:", data);
    }, interval);
}

// Run when connected
client.on("connect", () => {
    console.log("Mock Pis connected to MQTT!");
    publishMockData();
});