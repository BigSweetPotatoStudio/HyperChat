---
lang: zh-CN
title: MCP安装
description: 
---

#### HyperChat 安装MCP，支持`stdio`,`sse`,`streamableHttp`，支持启用，禁用，同步MCP。


#### 点击添加
![alt text](image-7.png)

### stdio类型的添加
HyperChat添加mcp，和其他的客户端一样，只是把，`command` 和 `args` ,放在一起填入，用空格分开。如图，一一对应。

```
{
      "command": "npx",
      "args": [
        "-y",
        "@amap/amap-maps-mcp-server"
      ],
      "env": {
        "AMAP_MAPS_API_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxx"
      },
}
```

![alt text](image-8.png)

### `sse`和`streamableHttp`类型的添加

![alt text](image-9.png)


### MCP启用，禁用
![alt text](image-10.png)

### MCP同步
通过MCP，同步这mcp配置
![alt text](image-12.png)

