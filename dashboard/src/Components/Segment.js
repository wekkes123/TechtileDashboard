import React from "react";
import RpiCell from "./RpiCell";
import {Button, Switch} from "antd";
import { PoweroffOutlined } from "@ant-design/icons";

const Segment = ({ segmentLabel, segmentData, updateTile, toggleSegment }) => {
    if (!segmentData || !segmentData.tiles) {
        return <div>Loading {segmentLabel}...</div>;
    }

    const tiles = segmentData.tiles;
    const tileKeys = Object.keys(tiles);

    // Extract unique columns and rows dynamically
    const cols = [...new Set(tileKeys.map(key => key.charAt(0)))].sort();
    const rows = [...new Set(tileKeys.map(key => key.slice(1)))].sort();
    const cellsPerRow = Math.max(1, Math.ceil(rows.length / 2 - 1));

    const setSegmentStatus = (status) => {
        Object.keys(tiles).forEach(tileId => {
            updateTile(tileId, { status });
        });
    };

    return (
        <div style={{border: "1px solid #ddd", padding: "10px", borderRadius: "8px"}}>
            <h2 style={{textAlign: "center"}}>{segmentLabel}</h2>

            <div style={{
                textAlign: "center",

                display: "flex",
                justifyContent: "center",
                gap: "10px"
            }}>
                <Button type="primary" onClick={() => setSegmentStatus("working")} style={{backgroundColor: "green"}}>
                    Turn All On
                </Button>
                <Button danger onClick={() => setSegmentStatus("deactivated")}>
                    Turn All Off
                </Button>
            </div>


            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(8, 1fr)",
                    maxWidth: "48vw",
                    gridAutoRows: "1fr",
                    gap: "10px",
                    justifyItems: "center",
                }}
            >
                {rows.reduce((result, rowLabel, index) => {
                    if (index % cellsPerRow === 0) {
                        result.push([]);
                    }
                    result[result.length - 1].push(rowLabel);
                    return result;
                }, []).map((rowGroup, groupIndex) => (
                    <React.Fragment key={groupIndex}>
                        {rowGroup.map((rowLabel) => (
                            <React.Fragment key={rowLabel}>
                                {cols.map((colLabel) => {
                                    const tileKey = `${colLabel}${rowLabel}`;
                                    return tiles[tileKey] ? (
                                        <RpiCell
                                            key={tileKey}
                                            tile={tiles[tileKey]}
                                            wallName={segmentLabel}
                                            updateTile={updateTile}
                                            disabled={!segmentData.active} // Disable tiles if inactive
                                        />
                                    ) : (
                                        <div key={tileKey} style={{height: "40px"}}></div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Segment;
