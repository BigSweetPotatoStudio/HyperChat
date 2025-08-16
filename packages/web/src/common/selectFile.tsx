import { UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Tag,
  Upload,
  message,
} from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { call, callElectron } from "./call";
import { isOnBrowser } from "./const"; // Corrected import from util to const

/**
 * Defines the props for the SelectFile component.
 */
interface SelectFileProps {
  /**
   * The current value of the selected file/directory path.
   */
  value?: string;
  /**
   * Callback function triggered when the selected file/directory path changes.
   * @param v The new path.
   */
  onChange?: (v: string) => void;
  /**
   * File filters for native file dialogs (Electron).
   */
  filters?: any[];
  /**
   * The type of file selection dialog to open.
   */
  type?: "openFile" | "openDirectory";
  /**
   * The type of file expected for browser uploads.
   */
  uploadType?: "image" | "video" | "any";
  /**
   * React children to render inside the component.
   */
  children?: React.ReactNode;
  /**
   * Callback function triggered when a file is selected or dropped.
   * @param file The selected or dropped File object.
   */
  onFileChange?: (file: File) => void;
  /**
   * Forces the component to use browser-based file selection even if in Electron.
   */
  useBrowser?: boolean;
}

/**
 * A component for selecting files or directories, supporting native dialogs (Electron),
 * browser uploads, and drag-and-drop functionality.
 * @param {SelectFileProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered SelectFile component.
 */
export function SelectFile(props: SelectFileProps): React.ReactElement {
  const [value, setValue] = useState(props.value || "");
  const [isDragActive, setIsDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropzone = dropRef.current;
    if (!dropzone) {
      return;
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        const filePath = (file as any)?.path;
        if (filePath) {
          setValue(filePath);
          props.onChange?.(filePath);
        }
        if (file) {
          props.onFileChange?.(file);
        }
      }
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
  }, [props.onChange, props.onFileChange]);

  const fileDialogOptions = useMemo((): { type?: "openFile" | "openDirectory"; filters?: { name: string; extensions: string[]; }[]; } => {
    if (props.type === "openDirectory") {
      return { type: "openDirectory" as const };
    } else {
      let extensions: string[] = [];
      if (props.uploadType === "image") {
        extensions = ["jpg", "jpeg", "png", "gif"];
      } else if (props.uploadType === "video") {
        extensions = ["mp4", "mkv", "webm"];
      }
      const filters = extensions.length > 0 ? [{ name: "Files", extensions }] : props.filters;
      return {
        type: "openFile" as const,
        ...(filters && { filters }),
      };
    }
  }, [props.type, props.uploadType, props.filters]);

  // Render browser-based upload or native file dialog based on environment/prop
  if (isOnBrowser || props.useBrowser) {
    return (
      <div>
        <Upload
          fileList={[]}
          beforeUpload={async (file) => {
            if (file) {
              props.onFileChange?.(file);
              if (props.onChange) {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("./api/uploads", {
                  method: "POST",
                  body: formData,
                }).then((r) => r.json());
                setValue(res.data.filepath);
                props.onChange(res.data.filepath);
              }
            }
            return false; // Prevent default Ant Design upload behavior
          }}
        >
          {props.children ? (
            props.children
          ) : (
            <div>
              <Button icon={<UploadOutlined />}>
                {props.type === "openDirectory"
                  ? "Select or Drop Folder"
                  : "Select or Drop File"}
              </Button>
              {value && (
                <Tag
                  closeIcon
                  onClose={() => {
                    setValue("");
                    props.onChange?.("");
                  }}
                >
                  {value}
                </Tag>
              )}
            </div>
          )}
        </Upload>
      </div>
    );
  }

  // Render native file dialog (Electron) with drag-and-drop
  return (
    <div
      ref={dropRef}
      onClick={async () => {
        const path = await callElectron("selectFile", fileDialogOptions);
        if (path) {
          setValue(path);
          props.onChange?.(path);
          // For native dialogs, we don't have a File object directly, so create a dummy one.
          props.onFileChange?.(new File([], path));
        }
      }}
    >
      {props.children ? (
        props.children
      ) : (
        <div>
          <Button icon={<UploadOutlined />}>
            {props.type === "openDirectory"
              ? "Select or Drop Folder"
              : "Select or Drop File"}
          </Button>
          {value && (
            <Tag
              closeIcon
              onClose={() => {
                setValue("");
                props.onChange?.("");
              }}
            >
              {value}
            </Tag>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Defines the props for the QuickPath component.
 */
interface QuickPathProps {
  /**
   * Callback function triggered when a file is dropped or pasted.
   * @param v The File object.
   */
  onChange?: (v: File) => void;
  /**
   * Callback function triggered when an image file is pasted.
   * @param v The image File object.
   */
  onParseFile?: (v: File) => void;
  /**
   * React children to render inside the component.
   */
  children?: React.ReactNode;
}

/**
 * A component that provides a drag-and-drop area and handles pasted files (especially images).
 * @param {QuickPathProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered QuickPath component.
 */
export function QuickPath(props: QuickPathProps): React.ReactElement {
  const [isDragActive, setIsDragActive] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dropzone = dropRef.current;
    if (!dropzone) {
      return;
    }

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file) {
          props.onChange?.(file);
        }
      }
    };

    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && item.kind === 'file') {
          const file = item.getAsFile();
          if (file && file.type.startsWith('image/')) {
            props.onParseFile?.(file);
          }
        }
      }
    };

    dropzone.addEventListener("dragenter", handleDragEnter);
    dropzone.addEventListener("dragleave", handleDragLeave);
    dropzone.addEventListener("dragover", handleDragOver);
    dropzone.addEventListener("drop", handleDrop);
    dropzone.addEventListener('paste', handlePaste);

    return () => {
      dropzone.removeEventListener("dragenter", handleDragEnter);
      dropzone.removeEventListener("dragleave", handleDragLeave);
      dropzone.removeEventListener("dragover", handleDragOver);
      dropzone.removeEventListener("drop", handleDrop);
      dropzone.removeEventListener('paste', handlePaste);
    };
  }, [props.onChange, props.onParseFile]);

  return <div ref={dropRef}>{props.children}</div>;
}
