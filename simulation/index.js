const { client } = require("../dashboard/src/MQTT/mqtt_config2");
const { publishRpiData } = require("./mock_pis");
const { publishPduData } = require("./mock_PDU");
const { publishMidspanData } = require("./mock_midspan");
const { publishTimeProviderData } = require("./mock_timeprovider");

// Run when connected
client.on("connect", () => {
    console.log("Mock Devices connected to MQTT!");

    publishRpiData();
    publishPduData();
    publishMidspanData();
    publishTimeProviderData();
});
