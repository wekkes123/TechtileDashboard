import { useEffect } from "react";
import mqtt from "mqtt";

const MQTT_BROKER = "wss://test.mosquitto.org:8081"; // Secure WebSocket URL

export default function MqttListener() {
    useEffect(() => {
        const client = mqtt.connect(MQTT_BROKER, {
            clientId: `web_client_${Math.random().toString(16).slice(2)}`,
            clean: true,
        });

        client.on("connect", () => {
            console.log("Connected to MQTT broker");
            client.subscribe("rpi/data", (err) => {
                if (!err) {
                    console.log("Subscribed to rpi/data");
                }
            });
        });

        client.on("message", (topic, message) => {
            console.log(`Received on ${topic}:`, message.toString());
        });

        client.on("error", (err) => {
            console.error("MQTT Connection Error:", err);
        });

        return () => client.end();
    }, []);

    return <div>Check the console for MQTT messages</div>;
}
