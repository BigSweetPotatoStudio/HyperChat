# DirectoryPicker 组件使用说明

## 功能特性

- 🌐 **Web 标准支持**：优先使用现代浏览器的 File System Access API
- 🔄 **自动回退**：在不支持的浏览器中回退到 webkitdirectory
- 🎨 **灵活样式**：支持 Ant Design Button 的所有样式属性
- 💡 **用户友好**：自动显示浏览器兼容性提示
- 🔧 **TypeScript**：完整的类型定义支持

## 基本用法

```tsx
import { DirectoryPicker } from "../../components/DirectoryPicker";

function MyComponent() {
  const handleDirectorySelect = (path: string, handle?: FileSystemDirectoryHandle) => {
    console.log("选择的目录:", path);
    if (handle) {
      console.log("目录句柄:", handle);
    }
  };

  return (
    <DirectoryPicker onDirectorySelect={handleDirectorySelect}>
      选择项目目录
    </DirectoryPicker>
  );
}
```

## 高级用法

### 表单集成
```tsx
import { Form, Input } from "antd";
import { DirectoryPicker } from "../../components/DirectoryPicker";

function WorkspaceForm() {
  const [form] = Form.useForm();

  const handleDirectorySelect = (path: string) => {
    form.setFieldsValue({ workspacePath: path });
  };

  return (
    <Form form={form}>
      <Form.Item name="workspacePath" label="工作区路径">
        <Input.Group compact>
          <Input style={{ width: "calc(100% - 100px)" }} readOnly />
          <DirectoryPicker onDirectorySelect={handleDirectorySelect}>
            选择目录
          </DirectoryPicker>
        </Input.Group>
      </Form.Item>
    </Form>
  );
}
```

### 自定义样式
```tsx
<DirectoryPicker
  type="primary"
  size="large"
  onDirectorySelect={handleDirectorySelect}
  className="my-custom-class"
  showTooltip={false}
>
  <FolderOpenOutlined /> 选择工作目录
</DirectoryPicker>
```

## API 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| onDirectorySelect | `(path: string, handle?: FileSystemDirectoryHandle) => void` | - | 目录选择回调 |
| disabled | `boolean` | `false` | 是否禁用 |
| children | `React.ReactNode` | `"选择目录"` | 按钮内容 |
| className | `string` | - | 自定义 CSS 类名 |
| type | `ButtonType` | `"default"` | 按钮类型 |
| size | `ButtonSize` | `"middle"` | 按钮尺寸 |
| showTooltip | `boolean` | `true` | 是否显示兼容性提示 |

## 浏览器支持

### 现代浏览器（File System Access API）
- ✅ Chrome 86+
- ✅ Edge 86+
- ✅ Opera 72+

### 回退支持（webkitdirectory）
- ✅ Chrome 21+
- ✅ Firefox 50+
- ✅ Safari 11.1+
- ✅ Edge 79+

### 限制说明

1. **路径访问**：由于浏览器安全限制，无法获取完整的文件系统路径
2. **权限**：某些操作可能需要用户明确授权
3. **HTTPS**：File System Access API 需要在 HTTPS 环境下使用

## 工具函数

```tsx
import { 
  isDirectoryPickerSupported, 
  isFileSystemAccessSupported 
} from "../../components/DirectoryPicker";

// 检查是否支持目录选择
if (isDirectoryPickerSupported()) {
  console.log("支持目录选择");
}

// 检查是否支持现代 API
if (isFileSystemAccessSupported()) {
  console.log("支持 File System Access API");
}
```