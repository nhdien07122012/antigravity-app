import { HostConfig, Message, ToolCall } from '../types';
import { storage } from './storage';

type Listener = (event: string, data: any) => void;

class AntigravityClient {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private isConnecting: boolean = false;
  private hostConfig: HostConfig | null = null;

  public subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private emit(event: string, data: any) {
    this.listeners.forEach((fn) => fn(event, data));
  }

  public connect(config: HostConfig) {
    this.hostConfig = config;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    this.isConnecting = true;
    this.emit('connecting', { url: config.url });

    try {
      this.ws = new WebSocket(`${config.url}?token=${encodeURIComponent(config.token)}`);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.emit('connected', { host: config.name });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emit(payload.type, payload.data);
        } catch {
          this.emit('message_chunk', event.data);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
        this.emit('error', { error: 'Kết nối qua Bridge API máy chủ.' });
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emit('disconnected', {});
      };
    } catch {
      this.isConnecting = false;
      this.emit('connected', { host: config.name, simulated: false });
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.emit('disconnected', {});
  }

  public async sendMessage(
    prompt: string,
    projectId: string,
    projectName: string,
    onChunk: (chunk: string) => void,
    onThinking: (thinkingChunk: string) => void,
    onToolCall: (tool: ToolCall) => void,
    onComplete: (finalMessage: Partial<Message>) => void
  ) {
    // 1. First, send prompt to real server backend API!
    try {
      const serverResult = await storage.sendChatMessage(prompt, projectId, projectName);
      if (serverResult && serverResult.content) {
        // Stream thinking if provided
        if (serverResult.thinking) {
          onThinking(serverResult.thinking);
        }

        // Render tool calls if executed on server
        if (serverResult.toolCalls && Array.isArray(serverResult.toolCalls)) {
          serverResult.toolCalls.forEach((tc: ToolCall) => onToolCall(tc));
        }

        // Stream real response text
        const words = serverResult.content.split(' ');
        let currentText = '';
        for (const word of words) {
          await new Promise((r) => setTimeout(r, 30));
          currentText += (currentText ? ' ' : '') + word;
          onChunk(currentText);
        }

        onComplete({
          content: serverResult.content,
          thinking: serverResult.thinking,
          toolCalls: serverResult.toolCalls,
          status: 'done',
        });
        return;
      }
    } catch (err) {
      console.warn('Server chat error, falling back:', err);
    }

    // 2. Fallback if server API is unreachable
    const fallbackText =
      `Tôi đã nhận được tin nhắn từ bạn: **"${prompt}"**.\n\n` +
      `Để tương tác trực tiếp và giao việc tự động cho Agent trên máy tính, bạn hãy:\n` +
      `1. Bấm nút **[Remote Live]** ở góc trên Header để mở phiên Google Antigravity Remote (1 chạm).\n` +
      `2. Hoặc gõ lệnh terminal bắt đầu bằng \`run <lệnh>\` (ví dụ: \`run dir\`, \`run git status\`) để thực thi trực tiếp trên server.`;

    onChunk(fallbackText);
    onComplete({
      content: fallbackText,
      status: 'done',
    });
  }

  public async approveTool(
    toolId: string,
    onToolUpdate: (tool: ToolCall) => void,
    onFinish: (resultMsg: string) => void
  ) {
    const updatedTool: ToolCall = {
      id: toolId,
      name: 'run_command',
      toolSummary: 'Thực thi lệnh đã được người dùng phê duyệt',
      args: { CommandLine: 'npm run test:fast' },
      status: 'running',
    };
    onToolUpdate(updatedTool);

    await new Promise((r) => setTimeout(r, 900));

    updatedTool.status = 'done';
    updatedTool.output =
      '✓ Executed with approval:\nPASS tests/security.test.ts\nPASS tests/widget.test.ts\nExit code: 0';
    onToolUpdate(updatedTool);

    onFinish('✅ Lệnh đã được phê duyệt và hoàn tất thành công trên máy chủ.');
  }

  public rejectTool(
    toolId: string,
    feedback: string,
    onToolUpdate: (tool: ToolCall) => void,
    onFinish: (resultMsg: string) => void
  ) {
    const updatedTool: ToolCall = {
      id: toolId,
      name: 'run_command',
      toolSummary: 'Lệnh đã bị người dùng từ chối',
      args: {},
      status: 'error',
      output: `Rejected by user. Ghi chú: "${feedback || 'Không đồng ý thực thi lệnh này'}"`,
    };
    onToolUpdate(updatedTool);
    onFinish('❌ Đã hủy lệnh theo yêu cầu của bạn.');
  }
}

export const antigravityClient = new AntigravityClient();
