import React from "react";
import { Collapse } from "antd";
import PDUPort from "./PDUport";

const PDUDevice = ({ PDUId, PDUData, ports, togglePort }) => {
    const { Panel } = Collapse;
    const isOffline = PDUData?.data?.status?.value !== "active";

    return (
        <div style={{ marginBottom: "20px", border: "1px solid #ddd", padding: "10px", borderRadius: "8px" }}>
            <h2 style={{ textAlign: "center" }}>
                {PDUId} {isOffline ? <span style={{ color: "red" }}>❌</span> : <span style={{ color: "green" }}>✅</span>}
            </h2>

            <Collapse defaultActiveKey={[]} style={{ width: "auto" }}>
                <Panel header="Device Details" key="1">
                    {PDUData && (
                        <div>
                            {Object.entries(PDUData.data || {}).map(([key, valueObj]) => (
                                <p key={key}><strong>{key}:</strong> {valueObj.value}</p>
                            ))}
                            <p><strong>Last Received:</strong> {new Date(PDUData.last_received).toLocaleString()}</p>
                        </div>
                    )}
                </Panel>
            </Collapse>

            <div>
                <h3>PDU Ports</h3>
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {ports && Object.entries(ports).map(([portId, portData]) => (
                        <PDUPort key={portId} portId={portId} portData={portData} togglePort={togglePort} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PDUDevice;
