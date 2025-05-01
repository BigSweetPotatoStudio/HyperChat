import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
    bundler: viteBundler(),
    theme: defaultTheme({
        // 默认主题配置
        navbar: [
            {
                text: '首页',
                link: '/',
            },
        ],
        sidebar: [
            {
                text: '项目介绍',
                link: '/',
            },
            {
                text: '指南',
                children: [
                    {
                        text: '快速开始',
                        link: '/guide/quick-start.md',
                    },
                    {
                        text: '安装MCP',
                        link: '/guide/mcp.md',
                    },
                    {
                        text: '内置MCP',
                        link: '/guide/builtin-mcp.md',
                    },
                    {
                        text: '进阶',
                        link: '/guide/advanced.md',
                        children: [
                            {
                                text: '变量',
                                link: '/guide/var.md',
                            },

                        ],
                    },
                ],
            },
        ],
    }),
    port: 18080,
})