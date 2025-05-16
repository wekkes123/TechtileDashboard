
const { client } = require("../dashboard/src/MQTT/mqtt_config2");

function publishPduData() {
    const interval = 700;
    setInterval(() => {
        const pduId = `PDU-${Math.floor(Math.random() * 2) + 1}`; // PDU-1 to PDU-2
        const port = Math.floor(Math.random() * 8) + 1; // Port 1-8

        const data = {
            id: pduId,
            port: port,
            status: Math.random() > 0.2 ? "Enabled" : "Disabled",
            current: (Math.random() * 10).toFixed(2) + "A",
            voltage: "230V",
            power: (Math.random() * 200).toFixed(2) + "W",
            frequency: "50Hz",
        };

        client.publish("pdu/data", JSON.stringify(data));
        console.log("Published PDU:", data);
    }, interval);
}

module.exports = { publishPduData };
