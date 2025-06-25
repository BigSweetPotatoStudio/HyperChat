import { OpenAI } from "openai";
const openai = new OpenAI({
  apiKey: process.env.apiKey, // This is the default and can be omitted
  baseURL: process.env.baseURL,
});

const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_weather",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          unit: { type: "string", enum: ["c", "f"] },
        },
        required: ["location", "unit"],
        additionalProperties: false,
      },
      returns: { type: "string", description: "The weather in the location" },
    },
  },
];

let messages: Array<any> = [{ role: "user", content: "深圳天气今天怎么样?" }];

let response = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: messages,
  tools,
});

messages.push(response.choices[0].message);
console.log(response.choices[0].message.tool_calls);

let function_name =
  response.choices[0].message.tool_calls![0]["function"]["name"];
let function_args =
  response.choices[0].message.tool_calls![0]["function"]["arguments"];

let runs = {} as any;

runs.get_weather = ({ location, unit }) => {
  return "25度, 晴天";
};

console.log(function_name, function_args);

let res = runs[function_name](function_args);
console.log(res);

messages.push({
  role: "tool",
  tool_call_id: response.choices[0].message.tool_calls![0]["id"],
  content: res,
});
response = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: messages,
});
console.log(response.choices[0].message);
console.log(messages);
