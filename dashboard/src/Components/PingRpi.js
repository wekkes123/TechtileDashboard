const pingRpi = async (rpiId) => {
    const hostname = `http://rpi-${rpiId}.local:8000/health`; // adjust port & path to match your setup

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

        const response = await fetch(hostname, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (response.ok) {
            console.log(`RPi ${rpiId} is reachable`);
            return 'working';
        } else {
            console.warn(`RPi ${rpiId} responded with status ${response.status}`);
            return 'faulty';
        }
    } catch (error) {
        console.warn(`RPi ${rpiId} is unreachable:`, error.message);
        return 'faulty';
    }
};
