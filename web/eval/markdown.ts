console.log("turndown");

// import { Readability } from "@mozilla/readability";
// // @ts-ignore
// import { gfm } from "turndown-plugin-gfm";
// import TurndownService from "turndown";

// export function extract_from_dom(dom) {
//   const turndownService = new TurndownService({
//     headingStyle: "atx",
//     hr: "---",
//     bulletListMarker: "-",
//     codeBlockStyle: "fenced",
//   });

//   turndownService.use(gfm);

//   const getExt = (node: any) => {
//     // Simple match where the <pre> has the `highlight-source-js` tags
//     const getFirstTag = (node: Element) =>
//       node.outerHTML.split(">").shift()! + ">";

//     const match = node.outerHTML.match(/(highlight-source-|language-)[a-z]+/);

//     if (match) return match[0].split("-").pop();

//     // Check the parent just in case
//     const parent = getFirstTag(node.parentNode!).match(
//       /(highlight-source-|language-)[a-z]+/,
//     );

//     if (parent) return parent[0].split("-").pop();

//     const getInnerTag = (node: Element) =>
//       node.innerHTML.split(">").shift()! + ">";

//     const inner = getInnerTag(node).match(
//       /(highlight-source-|language-)[a-z]+/,
//     );

//     if (inner) return inner[0].split("-").pop();

//     // Nothing was found...
//     return "";
//   };

//   turndownService.addRule("fenceAllPreformattedText", {
//     filter: ["pre"],

//     replacement: function (content, node) {
//       const ext = getExt(node);

//       const code = [...node.childNodes].map((c) => c.textContent).join("");

//       return `\n\`\`\`${ext}\n${code}\n\`\`\`\n\n`;
//     },
//   });

//   turndownService.addRule("strikethrough", {
//     filter: ["del", "s"],

//     replacement: function (content) {
//       return "~" + content + "~";
//     },
//   });

//   turndownService.addRule("r", {
//     filter: ["script", "style"],

//     replacement: function (content) {
//       return "";
//     },
//   });

//   // let article = new Readability(dom, {
//   //   keepClasses: true,
//   //   debug: false,
//   //   charThreshold: 100,
//   // }).parse();

//   // if (!article) {
//   //   throw new Error("Failed to parse article");
//   // }
//   // // remove HTML comments
//   // article.content = article.content.replace(/(\<!--.*?\-->)/g, "");

//   // // Try to add proper h1 if title is missing
//   // if (article.title.length > 0) {
//   //   // check if first h2 is the same as title
//   //   const h2Regex = /<h2[^>]*>(.*?)<\/h2>/;
//   //   const match = article.content.match(h2Regex);
//   //   if (match?.[0].includes(article.title)) {
//   //     // replace fist h2 with h1
//   //     article.content = article.content
//   //       .replace("<h2", "<h1")
//   //       .replace("</h2", "</h1");
//   //   } else {
//   //     // add title as h1
//   //     article.content = `<h1>${article.title}</h1>\n${article.content}`;
//   //   }
//   // }
//   // contert to markdown
//   let res = (turndownService as any).turndown(dom);

//   // replace weird header refs
//   const pattern = /\[\]\(#[^)]*\)/g;
//   res = res.replace(pattern, "");
//   return res;
// }

declare function resolve(s: string): string;

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
      } else {
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
    if (
      computedDisplay === "block" ||
      computedDisplay === "flex" ||
      computedDisplay === "grid"
    ) {
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
        } else {
          if (node.getBoundingClientRect().height == 0) {
            return "";
          }
        }
      } catch (e) {
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
            } else {
              markdown += `\n# ${children}\n`;
            }
            break;
          case "h2":
            children = Array.from(node.childNodes)
              .map((childNode) => traverse(childNode, line))
              .join("");
            if (line) {
              markdown += ` **${children}** `;
            } else {
              markdown += `\n## ${children}\n`;
            }
            break;
          case "h3":
            children = Array.from(node.childNodes)
              .map((childNode) => traverse(childNode, line))
              .join("");
            if (line) {
              markdown += ` **${children}** `;
            } else {
              markdown += `\n### ${children}\n`;
            }
            break;
          case "h4":
            children = Array.from(node.childNodes)
              .map((childNode) => traverse(childNode, line))
              .join("");
            if (line) {
              markdown += ` **${children}** `;
            } else {
              markdown += `\n#### ${children}\n`;
            }
            break;
          case "h5":
            children = Array.from(node.childNodes)
              .map((childNode) => traverse(childNode, line))
              .join("");
            if (line) {
              markdown += ` **${children}** `;
            } else {
              markdown += `\n##### ${children}\n`;
            }
            break;
          case "h6":
            children = Array.from(node.childNodes)
              .map((childNode) => traverse(childNode, line))
              .join("");
            if (line) {
              markdown += ` **${children}** `;
            } else {
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
            } else {
              markdown += "\n";
            }
            break;
          case "img":
            const alt = node.getAttribute("alt") || "";
            const src = node.getAttribute("src") || "";
            if (src.startsWith("data:image")) {
              markdown += "";
            } else {
              if (line) {
                markdown += `![${alt}](${src})`;
              } else {
                markdown += `\n![${alt}](${src})\n`;
              }
            }

            break;
          case "pre":
            markdown += "\n";

            if (
              node.firstChild &&
              node.firstChild?.tagName?.toLowerCase() === "code"
            ) {
              const codeContent = node.firstChild.textContent;
              markdown += "```\n" + codeContent + "\n```\n\n";
            } else {
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
            } else {
              markdown += children;
            }
            break;
          case "table":
            let head = false;
            if (node.querySelector("thead")) {
              head = true;
              const rows = Array.from(
                node.querySelector("thead").querySelectorAll("tr"),
              );
              markdown += rows
                .map((row: any, rowIndex) => {
                  const cells = Array.from(row.querySelectorAll("td, th"));
                  return (
                    cells
                      .map(
                        (cell: any) =>
                          traverse(cell, true).replaceAll("\n", " ").trim() ||
                          cell.textContent.replaceAll("\n", " ").trim(),
                      )
                      .join(" | ") +
                    (rowIndex === 0
                      ? "\n" + cells.map(() => "---").join(" | ")
                      : "")
                  );
                })
                .join("\n");
              markdown += "\n";
            }
            let t = node;
            for (let node of t.querySelectorAll("tbody")) {
              const rows = Array.from(node.querySelectorAll("tr"));
              let mdhead = "";
              let mdbody = rows
                .map((row: any, rowIndex) => {
                  const cells = Array.from(row.querySelectorAll("td, th"));
                  if (rowIndex == 0 && !head) {
                    mdhead =
                      "\n" +
                      cells.map((x, index) => "title " + index).join(" | ");
                    mdhead += "\n" + cells.map(() => "---").join(" | ");
                    mdhead += "\n";
                  }
                  let body = cells

                    .map((cell: any) =>
                      traverse(cell, true).replaceAll("\n", " ").trim(),
                    )
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
            } else if (isEffectivelyBlock(node)) {
              markdown += markdown.endsWith("\n") ? "" : "\n";

              children = Array.from(node.childNodes)
                .map((childNode) => traverse(childNode, line))
                .join("");
              markdown += children;

              markdown += markdown.endsWith("\n") ? "" : "\n";
            } else {
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

  let md = htmlToMarkdown(
    document.querySelector("main") ||
      document.querySelector("#main") ||
      document.querySelector(".main") ||
      document.body,
  );
  console.log(md);
  resolve(md);
} catch (e) {
  console.error(e);
  resolve("failed");
}
