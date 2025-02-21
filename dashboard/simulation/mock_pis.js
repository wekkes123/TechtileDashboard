const { client } = require("./mqtt_config");

function publishMockData() {
    setInterval(() => {
        const data = {
            id: `pi_${Math.floor(Math.random() * 140)}`,
            temp: (Math.random() * 20 + 40).toFixed(2),
            status: Math.random() > 0.1 ? "online" : "offline",
        };

        client.publish("rpi/data", JSON.stringify(data));
        console.log("Published:", data);
    }, 100);
}

// Run when connected
client.on("connect", () => {
    console.log("Mock Pis connected to MQTT!");
    publishMockData();
});
