import axios from "axios";

const pingRpi = async (hostname) => {
    try {
        console.log(`pingRpi hostname=${hostname}`);
        const response = await axios.get(`http://10.128.48.5:5000/ping/${hostname}`);
        if (response.data.status === 'alive') {
            return 'working';
        } else {
            return 'deactivated';
        }

    } catch (err) {
        return 'faulty';
    }
};

export default pingRpi;
