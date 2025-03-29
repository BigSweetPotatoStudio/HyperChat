import React, {
  useState,
  useEffect,
  version,
  useCallback,
  useContext,
  useRef,
} from "react";
import "@xterm/xterm/css/xterm.css";

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

export function TerminalPage() {
  useEffect(() => {
    const terminalRef = document.getElementById("terminal") as HTMLDivElement;
    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: "#000000",
        foreground: "#ffffff",
      },
    //   cols: 80,
    //   rows: 30,
    });
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());
    xterm.open(terminalRef);
    fitAddon.fit();
  }, []);

  return (
    <div className="p-4">
      <div id="terminal" style={{ height: "100%" }}></div>
    </div>
  );
}
