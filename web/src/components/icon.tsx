import React from "react";
export const Icon = ({ name, style, className }: { name: string; style?: React.CSSProperties; className?: string }) => {
    return <svg className={"icon  inline-block " + (className || "")} style={style} aria-hidden="true">
        <use xlinkHref={`#icon-${name}`}></use>
    </svg>;
};