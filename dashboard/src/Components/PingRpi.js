const pingRpi = async (hostname) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);

        const response = await fetch(`http://${hostname}`, {
            method: 'HEAD',
            mode: 'no-cors', // still useful to trigger the request
            signal: controller.signal,
        });

        clearTimeout(timeout);
        return 'working';
    } catch (err) {
        return 'faulty';
    }
};

export default pingRpi;
