import { useEffect, useState } from "react";
import { Header } from "antd/es/layout/layout";
import { Button } from "antd";
import { MenuOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";

const DashboardHeader = ({ setOpen,showExtra, setShowExtra, statusJson }) => {
    const [experimentStatus, setExperimentStatus] = useState("inactive");
    const [experimentMessage, setExperimentMessage] = useState("");

    useEffect(() => {
        if (!statusJson) return;

        if (statusJson.status === "active") {
            setExperimentStatus("active");
            setExperimentMessage(statusJson.message || "");
        } else {
            setExperimentStatus("inactive");
            setExperimentMessage("");
        }
    }, [statusJson]);

    const active = experimentStatus === "active";

    return (
        <>
            <Header
                style={{
                    background: active ? "#BF3131" : "#001529",
                    padding: "0 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: "70px"
                }}
            >
                {/* dashboard title */}
                <div style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
                    Dashboard
                </div>

                {/* experiment message */}
                <div style={{
                    position: "absolute",
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "#000",
                    fontWeight: "bold",
                    fontSize: "16px",
                    whiteSpace: "nowrap"
                }}>
                    {active && experimentMessage && `An experiment is currently active: ${experimentMessage}`}
                    {active && experimentMessage === "" && `An experiment is currently active`}
                </div>

                {/* buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                        type="default"
                        icon={showExtra ? <UpOutlined /> : <DownOutlined />}
                        onClick={() => setShowExtra(prev => !prev)}
                    />
                    <Button
                        type="primary"
                        icon={<MenuOutlined />}
                        onClick={() => setOpen(true)}
                    >
                        Settings
                    </Button>
                </div>
            </Header>
        </>
    );
};

export default DashboardHeader;
