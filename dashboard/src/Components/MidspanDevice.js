import React from "react";
import POEPort from "./POEport";
import { Collapse } from "antd";

const MidspanDevice = ({ midspanId, midspanData, midspanRuntimeData, ports, togglePort }) => {
    const { Panel } = Collapse;
    const isOffline = midspanRuntimeData?.data?.status?.value !== "Operational";

    return (
        <div style={{marginBottom: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px"}}>
            <h2 style={{textAlign: "center"}}>
                {midspanId} {isOffline ? <span style={{ color: "red" }}>❌</span> : <span style={{ color: "green" }}>✅</span>}
            </h2>

            <Collapse defaultActiveKey={[]} style={{width: "auto"}}>
                <Panel header="Device Details" key="1">
                    <p><strong>IP Address:</strong> {midspanData.ip}</p>
                    {midspanRuntimeData && (
                        <div>
                            {Object.entries(midspanRuntimeData.data || {}).map(([key, valueObj]) => (
                                <p key={key}><strong>{key}:</strong> {valueObj.value}</p>
                            ))}
                            <p><strong>Last Received:</strong> {new Date(midspanRuntimeData.last_received).toLocaleString()}</p>
                        </div>
                    )}
                </Panel>
            </Collapse>

            <div>
                <h3>POE Ports</h3>
                <div style={{display: "flex", flexWrap: "wrap"}}>
                    {ports && Object.entries(ports).map(([portId, portData]) => (
                        <POEPort key={portId} portId={portId} portData={portData} togglePort={togglePort}/>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MidspanDevice;
