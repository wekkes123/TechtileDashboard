import { Drawer, Switch } from "antd";

const ControlPanel = ({ open, onClose, viewMode, setViewMode }) => {
    return (
        <Drawer title="Tile Management" placement="right" width="50vw" onClose={onClose} open={open}>
            <Switch
                checked={viewMode === "segments"}
                onChange={() => setViewMode(viewMode === "walls" ? "segments" : "walls")}
                checkedChildren="Segments"
                unCheckedChildren="Walls"
            />
        </Drawer>
    );
};

export default ControlPanel;
