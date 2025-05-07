import { Avatar, Badge, Button, List, Modal, Segmented, Tabs } from "antd";
import React, {
  useState,
  useEffect,
  version,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Chat } from "../chat";
import { it } from "node:test";
import { v4 } from "uuid";
import { io } from "socket.io-client";
import { call, getURL_PRE, msg_receive } from "../../common/call";
import { GPT_MODELS, Agents } from "../../../../common/data";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { Sessions } from "./sessions";
import { LaptopOutlined, MinusOutlined } from "@ant-design/icons";
import { t } from "../../i18n";

export function Workspace() {
    return <div>WorkSpace</div>
}