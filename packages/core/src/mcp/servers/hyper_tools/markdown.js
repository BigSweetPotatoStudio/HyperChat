/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!**************************!*\
  !*** ./eval/markdown.ts ***!
  \**************************/

console.log("turndown");
try {
    function isEffectivelyBlock(element) {
        // debugger
        // Flex 容器的子元素
        const parent = element.parentElement;
        const parentDisplay = window.getComputedStyle(parent).display;
        if (parentDisplay.includes("flex")) {
            const flexDirection = window.getComputedStyle(parent).flexDirection;
            // 在垂直 flex 中，子元素实际上表现为 block
            if (["column", "column-reverse"].includes(flexDirection)) {
                return true;
            }
            else {
                return false;
            }
        }
        if (parentDisplay.includes("grid")) {
            return false;
        }
        const computedposition = window.getComputedStyle(element).position;
        if (computedposition === "absolute" || computedposition === "fixed") {
            return false;
        }
        // 直接计算的 display
        const computedDisplay = window.getComputedStyle(element).display;
        // 明确的 block 类型
        if (computedDisplay === "block" ||
            computedDisplay === "flex" ||
            computedDisplay === "grid") {
            return true;
        }
        return false;
    }
    window["htmlToMarkdown"] = htmlToMarkdown;
    function htmlToMarkdown(dom) {
        // 递归遍历 DOM 节点
        function traverse(node, line = false) {
            // if (line) {
            //   debugger;
            // }
            let markdown = "";
            // 处理文本节点
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim();
            }
            try {
                if (node.nodeType == Node.COMMENT_NODE) {
                    return "";
                }
                if (node.tagName == "TH" || node.tagName == "TD") {
                    // console.log(node);
                    // return node.textContent.trim();
                }
                else {
                    if (node.getBoundingClientRect().height == 0) {
                        return "";
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
            // 处理元素节点
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                let children = "";
                switch (tagName) {
                    case "h1":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n# ${children}\n`;
                        }
                        break;
                    case "h2":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n## ${children}\n`;
                        }
                        break;
                    case "h3":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n### ${children}\n`;
                        }
                        break;
                    case "h4":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n#### ${children}\n`;
                        }
                        break;
                    case "h5":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n##### ${children}\n`;
                        }
                        break;
                    case "h6":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (line) {
                            markdown += ` **${children}** `;
                        }
                        else {
                            markdown += `\n###### ${children}\n`;
                        }
                        break;
                    case "p":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        markdown += `\n${children}\n`;
                        break;
                    case "strong":
                    case "b":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        markdown += ` **${children}** `;
                        break;
                    case "em":
                    case "i":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        markdown += `*${children}*`;
                        break;
                    case "a":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, true))
                            .join("");
                        const href = node.getAttribute("href");
                        markdown += `[${children.replaceAll("\n", "")}](${href})`;
                        break;
                    case "ul":
                        markdown += "\n\n";
                        //   children = Array.from(node.childNodes)
                        //     .map((childNode) => traverse(childNode, line))
                        //     .join("");
                        markdown += Array.from(node.childNodes)
                            .map((li) => traverse(li, true))
                            .filter((li) => li.trim() !== "")
                            // .map((li) => {
                            //   console.log("li", li);
                            //   return li;
                            // })
                            .map((li) => `- ${li}`)
                            .join("\n");
                        markdown += "\n\n";
                        break;
                    case "ol":
                        //   children = Array.from(node.childNodes)
                        //     .map((childNode) => traverse(childNode, line))
                        //     .join("");
                        markdown += Array.from(node.childNodes)
                            .map((li) => traverse(li, true))
                            .filter((li) => li.trim() !== "")
                            .map((li, index) => `${index + 1}. ${li}`)
                            .join("\n");
                        markdown += "\n\n";
                        break;
                    case "li":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        markdown += `${children}`;
                        break;
                    case "br":
                        if (line) {
                        }
                        else {
                            markdown += "\n";
                        }
                        break;
                    case "img":
                        const alt = node.getAttribute("alt") || "";
                        const src = node.getAttribute("src") || "";
                        if (src.startsWith("data:image")) {
                            markdown += "";
                        }
                        else {
                            if (line) {
                                markdown += `![${alt}](${src})`;
                            }
                            else {
                                markdown += `\n![${alt}](${src})\n`;
                            }
                        }
                        break;
                    case "pre":
                        markdown += "\n";
                        if (node.firstChild &&
                            node.firstChild?.tagName?.toLowerCase() === "code") {
                            const codeContent = node.firstChild.textContent;
                            markdown += "```\n" + codeContent + "\n```\n\n";
                        }
                        else {
                            // children = Array.from(node.childNodes)
                            //   .map((childNode) => traverse(childNode, line))
                            //   .join("");
                            // extract_from_dom(node);
                            markdown += "```\n" + node.textContent + "\n```\n\n";
                        }
                        break;
                    case "code":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        if (node.parentNode.tagName.toLowerCase() !== "pre") {
                            markdown += `\`${children}\``;
                        }
                        else {
                            markdown += children;
                        }
                        break;
                    case "table":
                        let head = false;
                        if (node.querySelector("thead")) {
                            head = true;
                            const rows = Array.from(node.querySelector("thead").querySelectorAll("tr"));
                            markdown += rows
                                .map((row, rowIndex) => {
                                const cells = Array.from(row.querySelectorAll("td, th"));
                                return (cells
                                    .map((cell) => traverse(cell, true).replaceAll("\n", " ").trim() ||
                                    cell.textContent.replaceAll("\n", " ").trim())
                                    .join(" | ") +
                                    (rowIndex === 0
                                        ? "\n" + cells.map(() => "---").join(" | ")
                                        : ""));
                            })
                                .join("\n");
                            markdown += "\n";
                        }
                        let t = node;
                        for (let node of t.querySelectorAll("tbody")) {
                            const rows = Array.from(node.querySelectorAll("tr"));
                            let mdhead = "";
                            let mdbody = rows
                                .map((row, rowIndex) => {
                                const cells = Array.from(row.querySelectorAll("td, th"));
                                if (rowIndex == 0 && !head) {
                                    mdhead =
                                        "\n" +
                                            cells.map((x, index) => "title " + index).join(" | ");
                                    mdhead += "\n" + cells.map(() => "---").join(" | ");
                                    mdhead += "\n";
                                }
                                let body = cells
                                    .map((cell) => traverse(cell, true).replaceAll("\n", " ").trim())
                                    .join(" | ");
                                return body;
                            })
                                .filter((row) => row.split(" | ").join("").trim() !== "")
                                .join("\n");
                            if (mdbody.split("\n").join("").trim() !== "") {
                                markdown += mdhead + mdbody;
                            }
                        }
                        markdown += "\n\n";
                        break;
                    case "tr":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, true))
                            .join("");
                        markdown += children;
                        break;
                    case "td":
                    case "th":
                        children = Array.from(node.childNodes)
                            .map((childNode) => traverse(childNode, line))
                            .join("");
                        markdown += children;
                        break;
                    case "script":
                    case "style":
                        break;
                    default:
                        if (line) {
                            children = Array.from(node.childNodes)
                                .map((childNode) => traverse(childNode, true))
                                .join("");
                            markdown += children;
                        }
                        else if (isEffectivelyBlock(node)) {
                            markdown += markdown.endsWith("\n") ? "" : "\n";
                            children = Array.from(node.childNodes)
                                .map((childNode) => traverse(childNode, line))
                                .join("");
                            markdown += children;
                            markdown += markdown.endsWith("\n") ? "" : "\n";
                        }
                        else {
                            children = Array.from(node.childNodes)
                                .map((childNode) => traverse(childNode, line))
                                .join("");
                            markdown += children;
                        }
                        break;
                }
            }
            return markdown;
        }
        return traverse(dom).trim();
    }
    let md = htmlToMarkdown(document.querySelector("main") ||
        document.querySelector("#main") ||
        document.querySelector(".main") ||
        document.body);
    console.log(md);
    resolve(md);
}
catch (e) {
    console.error(e);
    resolve("failed");
}

/******/ })()
;