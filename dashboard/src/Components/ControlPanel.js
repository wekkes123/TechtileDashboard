import { Drawer, Switch, Checkbox } from "antd";

const ControlPanel = ({ open, onClose, viewMode, setViewMode, wallNames, segmentNames, visibleItems, setVisibleItems }) => {
    const items = viewMode === "walls" ? Object.keys(wallNames || {}) : Object.keys(segmentNames || {});

    const toggleVisibleItem = (item) => {
        setVisibleItems((prev) => {
            const updatedItems = prev.includes(item)
                ? prev.filter((i) => i !== item)  // Unchecking (hiding)
                : [...prev, item];  // Checking (showing)

            // Prevent everything from being hidden
            return updatedItems.length > 0 ? updatedItems : prev;
        });
    };

    return (
        <Drawer title="Tile Management" placement="right" width="50vw" onClose={onClose} open={open}>
            <Switch
                checked={viewMode === "segments"}
                onChange={() => {
                    const newMode = viewMode === "walls" ? "segments" : "walls";
                    setViewMode(newMode);

                    // Reset visibleItems when switching modes
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
        </Drawer>
    );
};

export default ControlPanel;
