export function generateMockData(handleMessage) {
    const interval = 100; // Adjust this value to control the speed (milliseconds)

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
}
