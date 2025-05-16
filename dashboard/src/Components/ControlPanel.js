import { Drawer, Switch, Checkbox, Input, Button } from "antd";
import { useEffect, useState } from "react";

const ControlPanel = ({
                          open,
                          onClose,
                          viewMode,
                          setViewMode,
                          wallNames,
                          segmentNames,
                          visibleItems,
                          setVisibleItems,
                          rpi_ip,
                          activity
                      }) => {
    const [experimentEnabled, setExperimentEnabled] = useState(false);
    const [experimentInput, setExperimentInput] = useState("");

    useEffect(() => {
        setExperimentEnabled(activity);
    }, [activity]);

    const items = viewMode === "walls" ? Object.keys(wallNames || {}) : Object.keys(segmentNames || {});

    const toggleVisibleItem = (item) => {
        setVisibleItems((prev) => {
            const updatedItems = prev.includes(item)
                ? prev.filter((i) => i !== item)
                : [...prev, item];
            return updatedItems.length > 0 ? updatedItems : prev;
        });
    };

    const sendExperimentStatus = async (status, message = "") => {
        const payload = {
            status,
            message: message.trim()
        };

        try {
            const response = await fetch(`http://${rpi_ip}:5000/status`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            console.log(`Experiment ${status}:`, response);
        } catch (error) {
            console.error(`Failed to set experiment ${status}:`, error);
        }
    };

    const handleExperimentToggle = async (checked) => {
        setExperimentEnabled(checked);
        if (checked) {
            await sendExperimentStatus("active", experimentInput);
        } else {
            await sendExperimentStatus("inactive");
        }
    };

    const handleExperimentSubmit = async () => {
        await sendExperimentStatus("active", experimentInput);
    };

    return (
        <Drawer title="Tile Management" placement="right" width="50vw" onClose={onClose} open={open}>
            <Switch
                checked={viewMode === "segments"}
                onChange={() => {
                    const newMode = viewMode === "walls" ? "segments" : "walls";
                    setViewMode(newMode);
                    setVisibleItems([]);
                }}
                checkedChildren="Segments"
                unCheckedChildren="Walls"
            />

            <div style={{ marginTop: 20 }}>
                <h3>Show {viewMode === "walls" ? "Walls" : "Segments"}</h3>
                {items.map((item) => (
                    <Checkbox
                        key={item}
                        checked={visibleItems.includes(item)}
                        onChange={() => toggleVisibleItem(item)}
                    >
                        {item}
                    </Checkbox>
                ))}
            </div>

            <div style={{ marginTop: 30 }}>
                <h3>Experiments</h3>
                <Switch
                    checked={experimentEnabled}
                    onChange={handleExperimentToggle}
                    checkedChildren="On"
                    unCheckedChildren="Off"
                />

                <div style={{ marginTop: 10, display: "flex", gap: "10px" }}>
                    <Input
                        placeholder="Enter experiment message to inform your colleagues (optional)"
                        value={experimentInput}
                        onChange={(e) => setExperimentInput(e.target.value)}
                        disabled={!experimentEnabled}
                    />
                    <Button
                        type="primary"
                        onClick={handleExperimentSubmit}
                        disabled={!experimentEnabled || experimentInput.trim() === ""}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </Drawer>
    );
};

export default ControlPanel;
