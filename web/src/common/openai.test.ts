// web/src/common/openai.test.ts
import { OpenAiChannel, MyMessage } from './openai'; // Adjust path as needed
import { describe, it, expect, beforeEach } from 'vitest';

describe('OpenAiChannel.messages_format', () => {
  let channel: OpenAiChannel;

  beforeEach(() => {
    // Minimal options needed for OpenAiChannel instantiation for this test
    channel = new OpenAiChannel({ apiKey: 'test', baseURL: 'test' });
  });

  it('should omit tool_calls if content_tool_calls is undefined', async () => {
    const messages: MyMessage[] = [
      { role: 'user', content: 'Hello' },
      { 
        role: 'assistant', 
        content: 'Thinking...', 
        content_tool_calls: undefined 
      }
    ];
    const formattedMessages = await channel.messages_format(messages);
    const assistantMessage = formattedMessages.find(m => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage).not.toHaveProperty('tool_calls');
  });

  it('should omit tool_calls if content_tool_calls is null', async () => {
    const messages: MyMessage[] = [
      { role: 'user', content: 'Hello' },
      { 
        role: 'assistant', 
        content: 'Thinking...', 
        // @ts-ignore // To allow null assignment for testing, if MyMessage['content_tool_calls'] doesn't normally allow null
        content_tool_calls: null 
      }
    ];
    const formattedMessages = await channel.messages_format(messages);
    const assistantMessage = formattedMessages.find(m => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage).not.toHaveProperty('tool_calls');
  });

  it('should omit tool_calls if content_tool_calls is an empty array', async () => {
    const messages: MyMessage[] = [
      { role: 'user', content: 'Hello' },
      { 
        role: 'assistant', 
        content: 'Thinking...', 
        content_tool_calls: [] 
      }
    ];
    const formattedMessages = await channel.messages_format(messages);
    const assistantMessage = formattedMessages.find(m => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage).not.toHaveProperty('tool_calls');
  });

  // Optional: Add a test case for when content_tool_calls is valid and non-empty
  it('should include tool_calls if content_tool_calls is valid and non-empty', async () => {
    const messages: MyMessage[] = [
      { role: 'user', content: 'Hello' },
      { 
        role: 'assistant', 
        content: 'Thinking...', 
        content_tool_calls: [{
          id: 'call_123',
          type: 'function',
          function: { name: 'get_weather', arguments: '{"location": "Boston"}' }
        }]
      }
    ];
    const formattedMessages = await channel.messages_format(messages);
    const assistantMessage = formattedMessages.find(m => m.role === 'assistant');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage).toHaveProperty('tool_calls');
    expect(assistantMessage.tool_calls).toHaveLength(1);
    // @ts-ignore
    expect(assistantMessage.tool_calls[0].function.name).toBe('get_weather');
  });
});
