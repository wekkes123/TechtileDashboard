// Should display all the cells in a wall and be able to fully shut down a wall
import React from "react";
import RpiCell from "./RpiCell";

const WallGrid = ({ wallName, wallData, updateTile }) => {
    const { rows, cols, tiles } = wallData;

    return (
        <div style={{ marginBottom: "20px" }}>
            <h2 style={{ textAlign: "center" }}>{wallName}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "auto repeat(6, 1fr)", gap: "10px", alignItems: "center" }}>
                <div></div>
                {cols.map((colLabel) => (
                    <div key={colLabel} style={{ textAlign: "center", fontWeight: "bold" }}>
                        {colLabel}
                    </div>
                ))}
                {rows.map((rowLabel) => (
                    <>
                        <div style={{ textAlign: "center", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>{rowLabel}</div>
                        {cols.map((colLabel) => {
                            const tileKey = `${colLabel}${rowLabel}`;
                            return <RpiCell key={tileKey} tile={tiles[tileKey]} wallName={wallName} updateTile={updateTile} />;
                        })}
                    </>
                ))}
            </div>
        </div>
    );
};

export default WallGrid;
