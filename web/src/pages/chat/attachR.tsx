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
  resourceResList: Array<MCPTypes.ReadResourceResult>;
  resourceResListRemove: (x: MCPTypes.ReadResourceResult) => void;
  promptResList: Array<MCPTypes.GetPromptResult>;
  promptResListRemove: (x: MCPTypes.GetPromptResult) => void;
}) {
  return (
    <>
      <Flex gap="middle" className="overflow-x-auto">
        {props.resourceResList.length > 0 && "Resources: "}
        {props.resourceResList.map((x, index) =>
          x.contents
            .map((content, index) => {
              if (content.text != null) {
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
                          width: "80%",
                          title: "Tip",
                          maskClosable: true,
                          content: <div>{content.text as string}</div>,
                        });
                      }}
                    >
                      <Attachments.FileCard
                        className="cursor-pointer"
                        key={index}
                        item={{
                          name:
                            x.contents.length == 1
                              ? (x.call_name as string)
                              : (x.call_name as string) + " " + index,
                          uid: content.uid as string,
                          size: (content.text as string).length,
                        }}
                      />
                    </div>
                  </RemoveBox>
                );
              } else if (content.type == "image") {
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
                          width: "80%",
                          title: "Tip",
                          maskClosable: true,
                          content: <div>{content.path as string}</div>,
                        });
                      }}
                    >
                      <Attachments.FileCard
                        className="cursor-pointer"
                        key={index}
                        item={{
                          name: content.path as string,
                          uid: content.uid as string,
                          // thumbUrl: content.path as string,
                          // size: (content.text as string).length,
                          url: content.path as string,
                        }}
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
            })
            .flat(),
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
                      width: "80%",
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
