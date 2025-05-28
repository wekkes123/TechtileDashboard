//Should be displayed: Status(Enable/Disable), Power, Max power, Class(0<-->8), be able to enable disable

import React from "react";
import {Card} from "antd";

const POEPort = ({ portId, portData }) => {
    return (
        <Card>
            <strong>Port:</strong> {portId}<br />
            <strong>Tile:</strong> {portData.rpi}<br />
        </Card>
    );
};

export default POEPort;
