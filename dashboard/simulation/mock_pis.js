const { client } = require("../src/MQTT/mqtt_config2");

// Function to generate a random IP
const generateIP = () => `192.168.1.${Math.floor(Math.random() * 100) + 1}`; // Random IPs in 192.168.1.x
const getRandomLoad = () => (Math.random() * 100).toFixed(2) + "%";
const getRandomRam = () => (Math.random() * 8).toFixed(2) + "GB";
const getRandomDisk = () => (Math.random() * 500).toFixed(2) + "GB";
const getRandomTemp = () => (Math.random() * 40 + 30).toFixed(2);

// Generate mock devices with randomized ids (no 'RPi-' prefix)
const rpiDevices = Array.from({ length: 20 }, (_, i) => ({
    id: `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 20) + 1}`, // Random ID in the format of A1, B5, etc.
    ip: generateIP(),
    status: "Running", // Initial status
}));

// Function to publish RPi data
function publishRpiData() {
    setInterval(() => {
        rpiDevices.forEach((device) => {
            const statusRoll = Math.random();
            if (statusRoll < 0.05) {
                device.status = "Disabled";
            } else if (statusRoll < 0.1) {
                device.status = "FAULT";
            } else {
                device.status = "Running";
            }

            const data = {
                id: device.id,
                ip: device.ip,
                status: device.status,
                cpuLoad: getRandomLoad(),
                ram: getRandomRam(),
                diskUsage: getRandomDisk(),
                cpuTemp: getRandomTemp(),
            };

            // Publish data to a single topic
            client.publish("rpi/data", JSON.stringify(data));
            console.log(`Published RPi Data:`, data);
        });
    }, 1000);
}

// Handle incoming control commands
client.on("message", (topic, message) => {
    const [_, __, deviceId, command] = topic.split("/");

    if (command === "shutdown" || command === "reboot") {
        const device = rpiDevices.find((rpi) => rpi.id === deviceId);
        if (device) {
            if (command === "shutdown") {
                device.status = "Disabled";
                console.log(`${device.id} is shutting down.`);
            } else if (command === "reboot") {
                device.status = "Running";
                console.log(`${device.id} is rebooting.`);
            }

            // Publish updated device status to a single topic
            client.publish("rpi/data", JSON.stringify(device));
        }
    }
});

// Subscribe to control commands
client.on("connect", () => {
    rpiDevices.forEach((device) => {
        client.subscribe(`rpi/control/${device.id}/#`);
    });

    console.log("Mock Raspberry Pis connected to MQTT!");
    publishRpiData();
});

module.exports = { publishRpiData };
