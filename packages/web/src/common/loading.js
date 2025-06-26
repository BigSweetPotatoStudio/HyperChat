import ReactDOM from "react-dom/client";
import { Spin } from "antd";
import React, { useState, useEffect } from 'react';

/**
 * Global loading indicator management.
 * This module provides functions to show and hide a full-screen loading spinner.
 * It tracks the number of active requests to ensure the loading spinner is only
 * hidden when all concurrent requests have completed.
 */

/**
 * Tracks the number of active requests.
 * The loading spinner is displayed when `reqCount` is greater than 0,
 * and hidden when `reqCount` returns to 0.
 * @type {number}
 */
let reqCount = 0;

/**
 * Displays the global loading spinner.
 * If no requests are currently active (`reqCount` is 0), it creates and mounts
 * a new loading spinner DOM element. Otherwise, it just increments the request count.
 */
function show() {
    if (reqCount === 0) {
        const dom = document.createElement("div");
        dom.id = "loading";
        dom.style.position = "fixed";
        dom.style.top = "0";
        dom.style.right = "0";
        dom.style.bottom = "0";
        dom.style.left = "0";
        dom.style.background = "rgba(0, 0, 0, 0.5)";
        dom.style.display = "flex";
        dom.style.justifyContent = "center";
        dom.style.alignItems = "center";
        dom.style.zIndex = "9999";
        document.body.appendChild(dom);
        ReactDOM.createRoot(dom).render(<Spin size="large"></Spin>);
    }
    reqCount++;
}

/**
 * Hides the global loading spinner.
 * Decrements the request count. If `reqCount` becomes 0, it removes the
 * loading spinner DOM element from the document.
 */
function hide() {
    reqCount--;
    if (reqCount === 0) {
        const dom = document.getElementById("loading");
        if (dom) {
            document.body.removeChild(dom);
        }
    }
}

/**
 * An object providing methods to control the global loading spinner.
 * @property {function(): void} show - Function to display the loading spinner.
 * @property {function(): void} hide - Function to hide the loading spinner.
 */
export const fullLoading = {
    show,
    hide,
};

