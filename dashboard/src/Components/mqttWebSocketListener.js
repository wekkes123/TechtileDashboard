import mqtt from "mqtt";

const MQTT_BROKER = "ws://10.128.48.5:8081"; // Secure WebSocket URL

export function generateMockData(handlers = {}) {
    //this generates dummy data
    /*const interval = 100; // Adjust this value to control the speed (milliseconds)

    setInterval(() => {
        const letter = String.fromCharCode(65 + Math.floor(Math.random() * 6)); // A-F
        const number = Math.floor(Math.random() * 20) + 1; // 1-20

        const data = {
            id: `${letter}${number}`,
            temp: (Math.random() * 20 + 40).toFixed(2),
            status: Math.random() > 0.1 ? "1" : "0",
        };

        handleMessage(data); // Push data into Dashboard's function
        console.log("Generated:", data);
    }, interval);
     */

    //this is a real connection for when pub is online
    const client = mqtt.connect(MQTT_BROKER, {
        clientId: `web_client_${Math.random().toString(16).slice(2)}`,
        clean: true,
    });

    const topics = [
        "rpi/data",
        "midspan/data",
        "midspan/poepoort",
        "pdu/data",
        "server/data",
        "experiment"
    ];

    client.on("connect", () => {
        console.log("Connected to MQTT broker");
        topics.forEach((topic) => {
            client.subscribe(topic, (err) => {
                if (!err) {
                    console.log(`Subscribed to ${topic}`);
                }
            });
        });
    });

    client.on("message", (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            if(topic === "server/data") {
                console.log(data)
            }
            const handler = handlers[topic];
            if (handler) {
                handler(data);
            } else {
                console.warn(`No handler for topic: ${topic}`);
            }
        } catch (error) {
            console.error("Error parsing message:", error);
        }
    });

    client.on("error", (err) => {
        console.error("MQTT Connection Error:", err);
    });


    return () => client.end();
}
