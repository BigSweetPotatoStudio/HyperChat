import React, { useRef } from "react";
import { Button, message, Tooltip } from "antd";
import { FolderOpenOutlined, InfoCircleOutlined } from "@ant-design/icons";

interface DirectoryPickerProps {
  onDirectorySelect: (path: string, handle?: FileSystemDirectoryHandle) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  type?: "default" | "primary" | "ghost" | "dashed" | "link" | "text";
  size?: "large" | "middle" | "small";
  showTooltip?: boolean;
}

/**
 * 目录选择器组件
 * 支持现代浏览器的 File System Access API
 * 回退到传统的文件选择器（webkitdirectory）
 */
export function DirectoryPicker({
  onDirectorySelect,
  disabled = false,
  children,
  className,
  type = "default",
  size = "middle",
  showTooltip = true,
}: DirectoryPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDirectorySelect = async () => {
    try {
      // 优先使用现代的 File System Access API
      if ('showDirectoryPicker' in window) {
        try {
          const directoryHandle = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
          });
          
          // 获取目录路径（如果支持）
          let path = directoryHandle.name;
          if ('resolve' in directoryHandle) {
            // 尝试获取完整路径
            try {
              path = await getDirectoryPath(directoryHandle);
            } catch (e) {
              // 如果无法获取完整路径，使用目录名
              path = directoryHandle.name;
            }
          }
          
          onDirectorySelect(path, directoryHandle);
          return;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // 用户取消选择
            return;
          }
          console.warn('File System Access API failed, falling back to input method:', error);
        }
      }

      // 回退到传统方法
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (error) {
      console.error('Directory selection failed:', error);
      message.error('选择目录失败');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // 从第一个文件的路径中提取目录路径
      const firstFile = files[0];
      const webkitRelativePath = (firstFile as any).webkitRelativePath;
      
      if (webkitRelativePath) {
        // webkitRelativePath 格式: "folder/subfolder/file.txt"
        // 提取根目录名
        const pathParts = webkitRelativePath.split('/');
        const rootFolder = pathParts[0];
        onDirectorySelect(rootFolder);
      } else {
        // 如果没有 webkitRelativePath，使用文件名推导
        const path = firstFile.name.split('/')[0] || 'selected-directory';
        onDirectorySelect(path);
      }
    }
    
    // 清空输入框，允许重复选择同一目录
    event.target.value = '';
  };

  const buttonElement = (
    <Button
      type={type}
      size={size}
      icon={!children ? <FolderOpenOutlined /> : undefined}
      onClick={handleDirectorySelect}
      disabled={disabled}
      className={className}
    >
      {children || "选择目录"}
    </Button>
  );

  return (
    <>
      {showTooltip && !isDirectoryPickerSupported() ? (
        <Tooltip
          title="您的浏览器不支持目录选择功能，请使用支持的浏览器（如 Chrome、Edge 等）"
          placement="top"
        >
          {buttonElement}
        </Tooltip>
      ) : (
        buttonElement
      )}
      
      {/* 隐藏的文件输入框，用于回退方案 */}
      <input
        ref={fileInputRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </>
  );
}

/**
 * 尝试获取目录的完整路径
 * 注意：由于安全限制，这在大多数浏览器中可能不可用
 */
async function getDirectoryPath(directoryHandle: FileSystemDirectoryHandle): Promise<string> {
  // 这是一个实验性的方法，可能在某些浏览器中不可用
  if ('resolve' in directoryHandle) {
    try {
      // 尝试解析到根目录的路径
      const pathComponents = [];
      let currentHandle = directoryHandle;
      
      // 由于安全限制，我们通常只能获取目录名
      // 大多数浏览器不允许访问完整的文件系统路径
      return directoryHandle.name;
    } catch (e) {
      return directoryHandle.name;
    }
  }
  
  return directoryHandle.name;
}

/**
 * 检查浏览器是否支持目录选择
 */
export function isDirectoryPickerSupported(): boolean {
  return 'showDirectoryPicker' in window || 'webkitdirectory' in document.createElement('input');
}

/**
 * 检查是否支持现代的 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}