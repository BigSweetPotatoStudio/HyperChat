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
import { isOnBrowser } from "./util";


export function SelectFile(props: {
  value?: string;
  onChange?: (v: string) => void;
  filters?: any[];
  type?: "openFile" | "openDirectory";
  uploadType?: "image" | "video" | "any";
  children?: React.ReactNode;
  onFileChange?: (file: File) => void;
}) {
  const [value, setValue] = useState(props.value || "");
  const [isDragActive, setIsDragActive] = useState(false);
  const dropRef = useRef(null);
  useEffect(() => {
    const dropzone = dropRef.current;
    if (dropzone == null) {
      return;
    }
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
  let obj =
    props.type != "openDirectory"
      ? {
        type: "openFile" as const,
        filters:
          props.uploadType == ("image" as const)
            ? [
              {
                name: "Image Files",
                extensions: ["jpg", "jpeg", "png", "gif"],
              },
            ]
            : props.uploadType == ("video" as const)
              ? [
                {
                  name: "Image Files",
                  extensions: ["jpg", "jpeg", "png", "gif"],
                },
              ]
              : props.filters,
      }
      : { type: "openDirectory" as const };

  const inputRef = useRef(null);

  if (isOnBrowser) {
    return (
      <div>
        <Upload
          fileList={[]}
          beforeUpload={async (file) => {
            if (file) {
              props.onFileChange && props.onFileChange(file);
              //   const reader = new FileReader();
              //   reader.onload = (e) => {};
              //   reader.readAsDataURL(file);
              if (props.onChange) {
                let form = new FormData();
                form.append("file", file);
                let res = await fetch("./api/uploads", {
                  method: "POST",
                  // No need to set Content-Type header when sending FormData
                  // Browser will automatically set the correct multipart/form-data with boundary
                  body: form,
                }).then((r) => r.json());
                setValue(res.data.filepath);
                props.onChange && props.onChange(res.data.filepath);
              }
            }
            return false;
          }}
        >
          {props.children ? (
            props.children
          ) : (
            <div>
              <Button icon={<UploadOutlined />}>
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
          )}
        </Upload>
      </div>
    );
  }

  return (
    <div
      ref={dropRef}
      onClick={async () => {
        if (isOnBrowser) {
          inputRef.current.click();
        } else {
          let path = await call("selectFile", [obj]);
          setValue(path);
          props.onChange(path);
        }
      }}
    >
      {props.children ? (
        props.children
      ) : (
        <div>
          <Button icon={<UploadOutlined />}>
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
      )}
    </div>
  );
}

export function QuickPath(props: {
  onChange?: (v: File) => void;
  onParseFile?: (v: File) => void;
  children?: any;
}) {
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

      props.onChange && props.onChange(e.dataTransfer.files[0]);
    };

    dropzone.addEventListener('paste', async (event) => {
      const items = event.clipboardData.items;
      let arr: any[] = Array.from(items);
      for (const item of arr) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type.startsWith('image/')) {
            (props.onParseFile) && props.onParseFile(file);

            // 上传逻辑
            // const url = await uploadFile(file); // 你需要实现这个函数
            // // 将上传后的图片链接插入到编辑器中
            // const insertText = `![图片描述](${url})`;
            // editor.trigger('keyboard', 'type', { text: insertText });
          }
        }
      }
    });
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

  return <div ref={dropRef}>{props.children}</div>;
}
