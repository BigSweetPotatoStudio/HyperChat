import React from "react";


export function Pre(p: any) {
    return (
      <div>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {p.children as string}
        </pre>
      </div>
    );
  }