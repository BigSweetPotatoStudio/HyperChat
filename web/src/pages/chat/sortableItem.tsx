import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RemoveBox } from "./attachR";
import {
  BorderInnerOutlined,
  DeleteOutlined,
  EditOutlined,
  FunctionOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { getFirstCharacter } from "../../common";
import { Tooltip } from "antd";

export function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative m-1 h-24 w-24 cursor-pointer overflow-hidden rounded-md border border-gray-200"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Tooltip title={props.item.description}>
      <div
        className="relative h-full w-full"
        style={{
          backgroundColor: hover ? "rgba(0, 0, 0, 0.05)" : "transparent",
        }}
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        onClick={() => {
          props.onClick && props.onClick(props.item);
        }}
      >
        <div className="flex h-4/5 w-full items-center justify-center">
          <div className="text-xl">{getFirstCharacter(props.item.label)}</div>
        </div>
        <div className="absolute left-0 top-0 z-10">
          {props.item.callable && (
            <FunctionOutlined className="text-blue-400" />
          )}
          {props.item.type == "builtin" && (
            <span className="text-red-400" >{props.item.type}</span>
          )}
        </div>
        {props.item.type != "builtin" && <div
          style={{
            display: hover ? "block" : "none",
          }}
          className="absolute right-0 top-0 z-10"
        >
          <SwapOutlined className="cursor-move" />

          <DeleteOutlined
            onClick={(e) => {
              e.stopPropagation();
              props.onRemove && props.onRemove(props.item);
            }}
            className="ml-2 cursor-pointer text-red-400 hover:text-red-800"
          />
          <span
            onClick={(e) => {
              e.stopPropagation();
              props.onEdit && props.onEdit(props.item);
            }}
          >
            <EditOutlined className="ml-2 cursor-pointer text-blue-400 hover:text-blue-800" />
          </span>
        </div>
        }
        <div className="absolute bottom-0 line-clamp-2 w-full bg-slate-600 text-center text-sm text-slate-50">
          {props.item.label}
        </div>
      </div>
      </Tooltip>
    </div>
  );
}

