import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Flex,
  Form,
  FormProps,
  Input,
  Select,
  Space,
  Steps,
  Image,
  Radio,
  Modal,
  Progress,
  Table,
  Divider,
  Upload,
  message,
  Tabs,
  Tag,
} from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import { call } from "./call";
export function SelectFile(props: {
  value?: string;
  onChange?: (v: string) => void;
  filters?: any[];
  type?: "openFile" | "openDirectory";
}) {
  const [value, setValue] = useState(props.value || "");
  const [isDragActive, setIsDragActive] = useState(false);
  const dropRef = useRef(null);
  useEffect(() => {
    const dropzone = dropRef.current;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      // const droppedFiles = Array.from(e.dataTransfer.files).map(
      //   (file) => file.path
      // );
      // setFiles((prevFiles) => [...prevFiles, ...droppedFiles]);
      setValue(e.dataTransfer.files[0].path);
      props.onChange(e.dataTransfer.files[0].path);
    };

    dropzone.addEventListener("dragenter", handleDragEnter);
    dropzone.addEventListener("dragleave", handleDragLeave);
    dropzone.addEventListener("dragover", handleDragOver);
    dropzone.addEventListener("drop", handleDrop);

    return () => {
      dropzone.removeEventListener("dragenter", handleDragEnter);
      dropzone.removeEventListener("dragleave", handleDragLeave);
      dropzone.removeEventListener("dragover", handleDragOver);
      dropzone.removeEventListener("drop", handleDrop);
    };
  }, []);

  return (
    <div>
      <Button
        ref={dropRef}
        onClick={async () => {
          let path = await call("selectFile", [
            {
              type: props.type || "openFile",
              filters: props.filters,
            },
            // {
            //   filters: [
            //     {
            //       name: "Video Files",
            //       extensions: ["mp4", "mov", "avi", "mkv"],
            //     },
            //   ],
            // },
          ]);
          setValue(path);
          props.onChange(path);
        }}
        icon={<UploadOutlined />}
      >
        {props.type == "openDirectory"
          ? "Select or Drop Folder"
          : "Select or Drop File"}
      </Button>

      {value ? (
        <Tag
          closeIcon
          onClose={() => {
            setValue("");
            props.onChange("");
          }}
        >
          {value}
        </Tag>
      ) : (
        ""
      )}
    </div>
  );
}
