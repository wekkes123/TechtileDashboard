//Should be displayed: Status(Enable/Disable), Power, Max power, Class(0<-->8), be able to enable disable

import React from "react";
import {Card} from "antd";

const POEPort = ({ portId, portData }) => {
    return (
        <Card
            style={{
                height: "110px",
                width: "110px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center"
            }}
        >
            <div>
                <strong>Port:</strong> {portId}<br />
                <strong>Tile:</strong> {portData.rpi}
            </div>
        </Card>

    );
};

export default POEPort;
