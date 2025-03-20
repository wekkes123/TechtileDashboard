const { client } = require("../src/MQTT/mqtt_config2");

function publishMidspanData() {
    const interval = 800;
    setInterval(() => {
        const midspanId = `Midspan-${Math.floor(Math.random() * 3) + 1}`; // Midspan-1 to Midspan-3
        const port = Math.floor(Math.random() * 8) + 1; // Port 1-8

        const data = {
            id: midspanId,
            port: port,
            status: Math.random() > 0.3 ? "Enabled" : "Disabled",
            power: (Math.random() * 30).toFixed(2) + "W",
            maxPower: (Math.random() * 60).toFixed(2) + "W",
            class: Math.floor(Math.random() * 9), // Class 0-8
            totalPowerConsumption: (Math.random() * 100).toFixed(2) + "W",
            maxAvailablePowerBudget: "500W",
            systemVoltage: "48V",
            temperature: (Math.random() * 20 + 20).toFixed(2) + "°C",
        };

        client.publish("midspan/data", JSON.stringify(data));
        console.log("Published Midspan:", data);
    }, interval);
}

module.exports = { publishMidspanData };
