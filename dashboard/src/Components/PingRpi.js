import axios from "axios";

const pingRpi = async (hostname) => {
    try {
        const response = await axios.get(`http://localhost:5000/ping/${hostname}`);
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
