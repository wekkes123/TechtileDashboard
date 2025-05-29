import { Drawer, Switch, Checkbox, Input, Button, Typography } from "antd";
import { useEffect, useState } from "react";

const { Text } = Typography;

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
                          activity,
                          tiles,
                          setSelectedDisplayField
                      }) => {
    const [experimentEnabled, setExperimentEnabled] = useState(false);
    const [experimentInput, setExperimentInput] = useState("");
    const [showUpdateNotice, setShowUpdateNotice] = useState(false);
    const [selectedField, setSelectedField] = useState(null);

    useEffect(() => {
        setExperimentEnabled(activity);
    }, [activity]);

    const items = viewMode === "walls" ? Object.keys(wallNames || {}) : Object.keys(segmentNames || {});

    const getAvailableDataFields = () => {
        for (const tile of Object.values(tiles || {})) {
            if (tile.status?.value === "working" && tile.data && Object.keys(tile.data).length > 0) {
                return Object.keys(tile.data);
            }
        }
        return [];
    };

    const [availableFields, setAvailableFields] = useState([]);

    useEffect(() => {
        const extractFields = () => {
            for (const tile of Object.values(tiles || {})) {
                if (tile.status?.value === "working" && tile.data && Object.keys(tile.data).length > 0) {
                    return Object.keys(tile.data);
                }
            }
            return [];
        };

        const fields = extractFields();
        setAvailableFields(fields);
    }, [tiles]);


    const toggleVisibleItem = (item) => {
        setVisibleItems((prev) => {
            const updatedItems = prev.includes(item)
                ? prev.filter((i) => i !== item)
                : [...prev, item];
            return updatedItems.length > 0 ? updatedItems : prev;
        });
    };

    //updates the experiment status with an api request, the ip for the request comes form the yaml.
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
        } catch (error) {
            console.error(`Failed to set experiment ${status}:`, error);
        }
    };

    const handleExperimentToggle = async (checked) => {
        setExperimentEnabled(checked);
        handleInteraction();
        if (checked) {
            await sendExperimentStatus("active", experimentInput);
        } else {
            await sendExperimentStatus("inactive");
        }
    };

    const handleExperimentSubmit = async () => {
        handleInteraction();
        await sendExperimentStatus("active", experimentInput);
    };

    const handleInteraction = () => {
        setShowUpdateNotice(true);
        setTimeout(() => setShowUpdateNotice(false), 10000);
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

            <div style={{marginTop: 20}}>
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
            <div style={{marginTop: 30}}>
                <h3>Tile Display Data</h3>
                <select
                    value={selectedField || ""}
                    onChange={(e) => setSelectedDisplayField(e.target.value)}
                    style={{width: "100%", padding: "8px", fontSize: "14px"}}
                >
                    <option value="" disabled>Select data to display on tiles</option>
                    {availableFields.map((field) => (
                        <option key={field} value={field}>
                            {field}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{marginTop: 30}}>
                <h3>Experiments</h3>
                <Switch
                    checked={experimentEnabled}
                    onChange={handleExperimentToggle}
                    checkedChildren="On"
                    unCheckedChildren="Off"
                />

                {showUpdateNotice && (
                    <Text type="warning" style={{fontStyle: "italic", marginTop: 10, display: "block"}}>
                        Updating may take up to 10 seconds...
                    </Text>
                )}

                <div style={{marginTop: 10, display: "flex", gap: "10px"}}>
                    <Input
                        placeholder="Enter experiment message to inform your colleagues (optional)"
                        value={experimentInput}
                        onChange={(e) => {
                            setExperimentInput(e.target.value);
                            handleInteraction();
                        }}
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
