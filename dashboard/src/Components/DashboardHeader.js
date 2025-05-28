import { useEffect, useState } from "react";
import { Header } from "antd/es/layout/layout";
import { Button } from "antd";
import { MenuOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";

const DashboardHeader = ({ setOpen, debugFunctions, rpiIp, pingAllRpis, showExtra, setShowExtra }) => {
    const [experimentStatus, setExperimentStatus] = useState("inactive");
    const [experimentMessage, setExperimentMessage] = useState("");

    useEffect(() => {
        const fetchExperimentStatus = async () => {
            try {
                console.log("attempt")
                const response = await fetch(`http://${rpiIp}:5000/status`);
                const json = await response.json();
                console.log(json);
                if (json.status === "active") {
                    setExperimentStatus("active");
                    setExperimentMessage(json.message || "");
                } else {
                    setExperimentStatus("inactive");
                    setExperimentMessage("");
                }
            } catch (err) {
                console.error("Failed to fetch experiment status:", err);
                setExperimentStatus("inactive");
                setExperimentMessage("");
            }
        };

        fetchExperimentStatus();
        const interval = setInterval(fetchExperimentStatus, 5000);
        return () => clearInterval(interval);
    }, [rpiIp]);

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
                {/* Left: Dashboard title */}
                <div style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>
                    Dashboard
                </div>

                {/* Center: Experiment message */}
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
