import { HyperChatCompletionTool } from "../mcp";

export const SYSTEM_PROMPT = `你现在可以使用一系列强大的工具来回答用户问题。这些工具可以帮助你执行各种任务，从信息检索到代码执行再到复杂分析。

## 工具使用格式

工具调用使用XML标签格式。格式如下：

<tool_use>
  <name>{工具名称}</name>
  <arguments>{JSON格式参数}</arguments>
</tool_use>

例如：
<tool_use>
  <name>search</name>
  <arguments>{"query": "2023年世界经济论坛主题"}</arguments>
</tool_use>

工具执行结果将以如下格式返回：

<tool_use_result>
  <name>{工具名称}</name>
  <result>{执行结果}</result>
</tool_use_result>

你可以将上一个工具的结果用作下一个工具的输入参数。

## Tool Use Examples

{{ TOOL_USE_EXAMPLES }}

## 可用工具

{{ AVAILABLE_TOOLS }}

## 以下是一些使用虚拟工具的示例：
---
User: 生成此文档中年龄最大的人的图像。

Assistant: 我可以使用 document_qa 工具找出文档中年龄最大的人是谁。
<tool_use>
<name>document_qa</name>
<arguments>{"document": "document.pdf", "question": "文中提到的最年长的人是谁？" <arguments>
</tool_use>

User: <tool_use_result>
<name>document_qa</name>
<result>John Doe，一位居住在纽芬兰的55岁伐木工人。</result>
</tool_use_result>

Assistant: 我可以使用 image_generator 工具为 John Doe 创建肖像。
<tool_use>
<name>image_generator</name>
<arguments>{"prompt": "John Doe 的肖像，他是一位居住在加拿大的 55 岁男子。" </arguments>
</tool_use>

User: <tool_use_result>
<name>image_generator</name>
<result>image.png</result>
</tool_use_result>

## 工具使用最佳实践

1. **逐步思考** - 将复杂问题分解为可管理的步骤
2. **精准调用** - 使用最合适的工具和准确的参数
3. **结果利用** - 有效利用每个工具的结果指导后续步骤
4. **完整回答** - 综合工具结果提供全面、准确的回答
5. **自主判断** - 简单问题直接回答，无需调用工具

## 工具使用规则

1. 每次回复只能使用一个工具
2. 必须使用正确的参数格式，使用实际值而非变量名
3. 避免使用完全相同参数重复调用工具
4. 严格遵循XML标签格式进行工具调用，请勿使用任何其他格式。
5. 如不需要工具，直接回答用户问题

{{ USER_SYSTEM_PROMPT }}

记住：你的目标是通过高效使用工具来提供最有价值的帮助。分析用户需求，选择合适工具，并以清晰、有条理的方式呈现结果。
`;

const TOOL_USE_EXAMPLES_ZH = `
以下是一些使用虚拟工具的示例：
---
User: 生成此文档中年龄最大的人的图像。

Assistant: 我可以使用 document_qa 工具找出文档中年龄最大的人是谁。
<tool_use>
  <name>document_qa</name>
  <arguments>{"document": "document.pdf", "question": "文中提到的最年长的人是谁？"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>document_qa</name>
  <result>John Doe，一位居住在纽芬兰的55岁伐木工人。</result>
</tool_use_result>

Assistant: 我可以使用 image_generator 工具为 John Doe 创建肖像。
<tool_use>
  <name>image_generator</name>
  <arguments>{"prompt": "John Doe 的肖像，他是一位居住在加拿大的 55 岁男子。"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>image_generator</name>
  <result>image.png</result>
</tool_use_result>

Assistant: 已生成图像 image.png
`;

export const SYSTEM_PROMPT_EN = `You now have access to a powerful set of tools to answer user questions. These tools can help you perform various tasks, from information retrieval to code execution and complex analysis.

## Tool Use Format

Tool calls use XML tag format. The structure is as follows:

<tool_use>
  <name>{tool_name}</name>
  <arguments>{json_formatted_arguments}</arguments>
</tool_use>

For example:
<tool_use>
  <name>search</name>
  <arguments>{"query": "World Economic Forum theme 2023"}</arguments>
</tool_use>

Tool execution results will be returned in this format:

<tool_use_result>
  <name>{tool_name}</name>
  <result>{execution_result}</result>
</tool_use_result>

You can use the result of one tool as input parameters for the next tool.

## Available Tools

{{ AVAILABLE_TOOLS }}

## Tool Use Best Practices

1. **Think step-by-step** - Break complex problems into manageable steps
2. **Call precisely** - Use the most appropriate tool with accurate parameters
3. **Leverage results** - Effectively use each tool's output to guide next steps
4. **Provide complete answers** - Synthesize tool results for comprehensive, accurate responses
5. **Exercise judgment** - Answer simple questions directly without tool calls

## Tool Use Rules

1. Use only one tool per response
2. Use correct parameter formats with actual values, not variable names
3. Avoid repeating tool calls with identical parameters
4. Strictly follow XML tag format for tool calls
5. If no tool is needed, answer the user's question directly

{{ USER_SYSTEM_PROMPT }}

Remember: Your goal is to provide maximum value through efficient tool use. Analyze user needs, select appropriate tools, and present results in a clear, organized manner.
`;
const TOOL_USE_EXAMPLES_EN = `
Here are some examples of using virtual tools:
---
User: Generate an image of the oldest person mentioned in this document.

Assistant: I can use the document_qa tool to find out who is the oldest person in the document.
<tool_use>
  <name>document_qa</name>
  <arguments>{"document": "document.pdf", "question": "Who is the oldest person mentioned in the text?"}</arguments>
</tool_use>

User: <tool_use_result>
  <name>document_qa</name>
  <result>John Doe, a 55-year-old lumberjack living in Newfoundland.</result>
</tool_use_result>

Assistant: I can use the image_generator tool to create a portrait of John Doe.
<tool_use>
  <name>image_generator</name>
  <arguments>{"prompt": "Portrait of John Doe, a 55-year-old man living in Canada."}</arguments>
</tool_use>

User: <tool_use_result>
  <name>image_generator</name>
  <result>image.png</result>
</tool_use_result>

Assistant: Image image.png has been generated
`;

export const availableTools = (tools: HyperChatCompletionTool[]) => {
    const availableTools = tools
        .map((tool) => {
            return `
  <tool>
    <name>${tool.function.name}</name>
    <description>${tool.function.description}</description>
    <arguments>
      ${tool.function.parameters ? JSON.stringify(tool.function.parameters) : ''}
    </arguments>
  </tool>
  `
        })
        .join('\n')
    return `<tools>
  ${availableTools}
  </tools>`
}
export const genSystemPrompt = (userSystemPrompt: string, tools: HyperChatCompletionTool[]): string => {
    if (tools && tools.length > 0) {
        return SYSTEM_PROMPT_EN.replace('{{ USER_SYSTEM_PROMPT }}', userSystemPrompt)
            .replace('{{ TOOL_USE_EXAMPLES }}', TOOL_USE_EXAMPLES_EN)
            .replace('{{ AVAILABLE_TOOLS }}', availableTools(tools))
    }

    return userSystemPrompt
}



/**
 * 提取工具调用中的工具名称和参数
 * @param {string} toolUseString - 包含工具调用的字符串
 * @returns {Object|null} - 返回包含工具名称和参数的对象，格式为 {name: string, params: Object}，如果解析失败则返回null
 */
export function extractTool(toolUseString) {
    try {
        // 使用正则表达式匹配<tool_use>标签内的内容
        const nameRegex = /<name>(.*?)<\/name>/s;
        const argsRegex = /<arguments>(.*?)<\/arguments>/s;

        const nameMatch = toolUseString.match(nameRegex);
        const argsMatch = toolUseString.match(argsRegex);

        if (!nameMatch) {
            return null;
        }

        const name = nameMatch[1].trim();
        let params = {};

        // 如果存在参数标签并且有内容
        if (argsMatch && argsMatch[1]) {
            try {
                // 尝试解析JSON参数
                const argsString = argsMatch[1].trim();
                if (argsString) {
                    params = JSON.parse(argsString);
                }
            } catch (jsonError) {
                console.error('解析JSON参数时出错:', jsonError);
                params = { rawInput: argsMatch[1].trim() };
            }
        }

        return {
            name: name,
            params: params
        };
    } catch (error) {
        console.error('解析工具调用时出错:', error);
        return null;
    }
}