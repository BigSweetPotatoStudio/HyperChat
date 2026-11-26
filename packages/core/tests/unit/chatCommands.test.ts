import { beforeEach, describe, expect, it, vi } from 'vitest';
import { streamChatCompletion } from '../../src/commands/chatCommands.mjs';

const mocks = vi.hoisted(() => ({
  completion: vi.fn<() => Promise<string>>(),
  logError: vi.fn(),
}));

vi.mock('../../src/ai/ai.mjs', () => ({
  AiChannel: class {
    completion = mocks.completion;
  },
}));

vi.mock('../../src/ai/hyperchat-builtin-prompts.mjs', () => ({
  getBuiltinPrompts: () => ({ prompt: '' }),
}));

vi.mock('../../src/data/appSettingsService.mjs', () => ({
  getAppSettingsManager: () => ({ getAI: () => ({ models: [{ key: 'test-model' }] }) }),
}));

vi.mock('../../src/log.mjs', () => ({
  Logger: { debug: vi.fn(), error: mocks.logError },
}));

vi.mock('../../src/workspace/index.mjs', () => ({
  getWorkspaceManager: () => ({
    getCurrentWorkspace: () => ({
      workspacePath: '/test-workspace',
      getAgentInstance: () => ({
        getAgentPath: () => '/test-agent',
        getConfig: () => ({}),
      }),
      getMcpManager: () => undefined,
    }),
  }),
}));

vi.mock('../../src/utils/aiConfigHelper.mjs', () => ({
  buildEffectiveConfig: () => ({ modelKey: 'test-model' }),
}));

type ChatRequest = Parameters<typeof streamChatCompletion>[0];

function createRequest() {
  const write = vi.fn();
  const request: ChatRequest = {
    agentName: 'default',
    chatKey: 'test-chat',
    sessionId: 'test-session',
    messages: [],
    sseWriter: { write } as unknown as ChatRequest['sseWriter'],
  };

  return { request, write };
}

describe('streamChatCompletion turn events', () => {
  beforeEach(() => vi.clearAllMocks());

  it('emits one completion only after the full turn resolves', async () => {
    let resolve!: (result: string) => void;
    const promise = new Promise<string>((done) => {
      resolve = done;
    });
    mocks.completion.mockReturnValue(promise);
    const { request, write } = createRequest();

    await streamChatCompletion(request);
    expect(mocks.completion).toHaveBeenCalledOnce();
    expect(write).not.toHaveBeenCalled();

    resolve('Finished');
    await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
    expect(write).toHaveBeenCalledWith({
      type: 'chat_message_complete',
      data: { sessionId: 'test-session' },
    });
  });

  it('does not emit a successful completion when the turn rejects', async () => {
    const failure = new Error('Mock completion failure');
    mocks.completion.mockRejectedValue(failure);
    const { request, write } = createRequest();

    await streamChatCompletion(request);
    await vi.waitFor(() => expect(mocks.logError).toHaveBeenCalledWith('Chat completion error:', failure));
    expect(write).not.toHaveBeenCalled();
  });
});
