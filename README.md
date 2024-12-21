[中文](README.zh.md) | [English](README.md)


## Background

After the release of [MCP](https://modelcontextprotocol.io/introduction), I felt it had great potential. Initially, I wanted to develop a toolbox for MCP usage, but since `Claude Desktop` frequently gets accounts banned, I had to develop a Chat myself. It has been open-sourced.

## Features

A Chat that supports the MCP protocol, using OpenAI's protocol, compatible with `Claude Desktop` configuration files. Supports `Client` hot loading, restart, and disable.

### MCP: 

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resource support
- [x] Partial prompt support
- [x] Tool support
- [x] Supports English and Chinese

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Ensure that uvx or npx is installed on your system.

### [uvx](https://github.com/astral-sh/uv)

```
brew install uv
```
### [npx & nodejs](https://nodejs.org/en)

```
brew install node 
```

## Development

```
cd electron && npm install
cd web && npm install
npm run dev
```

## Note

For MacOS `nvm` users, manually enter PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

![image.png](./images/image4.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

![image.png](./images/image11.png)

![image.png](./images/image13.png)

![image.png](./images/image12.png)

![image.png](./images/image14.png)