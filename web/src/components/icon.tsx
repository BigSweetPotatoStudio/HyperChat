import React from "react";

export const Icon = ({ name }) => {
    return <svg className="icon" aria-hidden="true">
        <use xlinkHref={`#icon-${name}`}></use>
    </svg>;
};