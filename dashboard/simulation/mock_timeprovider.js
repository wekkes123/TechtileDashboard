const { client } = require("../src/MQTT/mqtt_config2");

function publishTimeProviderData() {
    const interval = 1000;
    setInterval(() => {
        const timeProviderId = `TimeProvider-1`;

        const data = {
            id: timeProviderId,
            status: "Online",
            lastSync: new Date().toISOString(),
        };

        client.publish("timeprovider/data", JSON.stringify(data));
        console.log("Published Time Provider:", data);
    }, interval);
}

module.exports = { publishTimeProviderData };
