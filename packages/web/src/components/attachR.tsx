import { Attachments } from "@ant-design/x";
import {
  Button,
  Carousel,
  Flex,
  Form,
  FormInstance,
  FormProps,
  Input,
  List,
  Modal,
  Radio,
  Segmented,
  Select,
  Space,
  Tooltip,
  Tree,
  TreeDataNode,
  TreeProps,
  Typography,
  message,
} from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { DeleteOutlined } from "@ant-design/icons";
import { CommonContentItem } from "@dadigua/hyperchat-shared";

// class AttachRItem {
//   type: "resource" | "prompts";

//   constructor(
//     public item: {
//       resources;
//     },
//     public type: "resource" | "prompts",
//   ) {
//     this.type = item.type;
//   }
// }

export function MyAttachR(props: {
  resourceResList: Array<(CommonContentItem & { uid: string; })>;
  resourceResListRemove: (x: { uid: string; }) => void;
  promptResList: Array<MCPTypes.GetPromptResult>;
  promptResListRemove: (x: MCPTypes.GetPromptResult) => void;
}) {
  return (
    <>
      <Flex gap="middle" className="overflow-x-auto">
        {props.resourceResList.length > 0 && "Resources: "}
        {props.resourceResList.map((x, index) => {

          if (x.type == "text") {
            return (
              <RemoveBox
                key={index}
                onRemove={() => {
                  props.resourceResListRemove(x);
                }}
              >
                <div
                  onClick={() => {
                    Modal.info({
                      width: "50%",
                      title: "Tip",
                      maskClosable: true,
                      content: <div>{x.text as string || "No Content"}</div>,
                    });
                  }}
                >
                  <Attachments.FileCard
                    className="cursor-pointer"
                    key={index}
                    item={{
                      name: x.text.split("\n")[0] || "Resource",
                      uid: x.uid as string,
                      size: (x.text as string).length,
                    }}
                  />
                </div>
              </RemoveBox>
            );
          } else if (x.type == "image_url") {
            return (
              <RemoveBox
                key={index}
                onRemove={() => {
                  props.resourceResListRemove(x);
                }}
              >
                <div
                  onClick={() => {
                    Modal.info({
                      width: "50%",
                      title: "Tip",
                      maskClosable: true,
                      content: (
                        <div>
                          <img
                            className="bg-cover"
                            src={x.image_url.url}
                          />
                        </div>
                      ),
                    });
                  }}
                >
                  {/* <Attachments.FileCard
                        className="cursor-pointer"
                        key={index}
                        item={{
                          name: content.path as string,
                          uid: content.uid as string,
                          // thumbUrl: content.path as string,
                          // size: (content.text as string).length,
                          url: content.blob as string,
                        }}
                      /> */}
                  <img
                    style={{ width: 68, height: 68 }}
                    className="bg-cover"
                    src={x.image_url.url as string}
                  />
                </div>
              </RemoveBox>
            );
          } else {
            return (
              <RemoveBox
                key={index}
                onRemove={() => {
                  props.resourceResListRemove(x);
                }}
              >
                <span>Not supported.</span>
              </RemoveBox>
            );
          }
        }
        )}
      </Flex>
      <Flex gap="middle" className="overflow-x-auto">
        {props.promptResList.length > 0 && "Prompts: "}
        {props.promptResList.map((x, index) => {
          let s = JSON.stringify(x.messages);
          return (
            <Tooltip key={index} title={x.description}>
              <RemoveBox
                onRemove={() => {
                  props.promptResListRemove(x);
                }}
              >
                <div
                  onClick={() => {
                    Modal.info({
                      width: "90%",
                      style: { maxWidth: 1024 },
                      title: "Tip",
                      maskClosable: true,
                      content: <div>{s}</div>,
                    });
                  }}
                >
                  <Attachments.FileCard
                    className="cursor-pointer"
                    key={index}
                    item={{
                      name: x.call_name as string,
                      uid: x.uid as string,
                      size: s.length,
                    }}
                  />
                </div>
              </RemoveBox>
            </Tooltip>
          );
        })}
      </Flex>
    </>
  );
}

export function RemoveBox(props: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => {
        setHover(true);
      }}
      onMouseLeave={() => {
        setHover(false);
      }}
    >
      <div
        style={{
          display: hover ? "block" : "none",
        }}
        className="absolute right-0 top-0 z-10"
        onClick={props.onRemove}
      >
        <DeleteOutlined className="cursor-pointer text-red-600" />
      </div>
      {props.children}
    </div>
  );
}
