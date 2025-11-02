import React from "react";

const OrderFilterButtons = ({ type, currentType, onClick, children }) => {
    const isActive = currentType === type;

    return (
        <button
            onClick={() => onClick(type)}
            style={{
                backgroundColor: isActive ? "black" : "transparent",
                color: isActive ? "white" : "inherit",
            }}
        >
            {children}
        </button>
    );
};

export default OrderFilterButtons;
