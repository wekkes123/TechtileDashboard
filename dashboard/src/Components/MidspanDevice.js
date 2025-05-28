// Should display: Total power consumption, max available power budget, system voltage, status

import React from "react";
import POEPort from "./POEport";
import { Collapse } from "antd";
import { Card } from "antd";

const MidspanDevice = ({ midspanId, midspanData, ports }) => {
    const { Panel } = Collapse;
    return (
        <div style={{marginBottom: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px",}}>
            <h2 style={{textAlign: "center"}}>{midspanId}</h2>

            <Collapse defaultActiveKey={[]} style={{width: "auto"}}>
                <Panel header="Device Details" key="1">
                    <p><strong>Hostname:</strong> {midspanData.hostname}</p>
                    <p><strong>IP Address:</strong> {midspanData.ip}</p>
                    <p><strong>Type:</strong> {midspanData.type}</p>
                    <p><strong>Ports:</strong> {midspanData["nr-ports"]}</p>
                </Panel>
            </Collapse>

            <h3>POE Ports</h3>
            <div style={{display: "flex", flexWrap: "wrap"}}>
                {ports && Object.entries(ports).map(([portId, portData]) => (
                    <POEPort key={portId} portId={portId} portData={portData}/>
                ))}
            </div>
        </div>

    )
        ;
};

export default MidspanDevice;
