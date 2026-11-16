import { HostConfig, Message, ToolCall } from '../types';

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
      // Connect to actual remote WebSocket
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

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        this.emit('error', { error: 'Không thể kết nối đến WebSocket host. Chuyển sang chế độ kết nối thử nghiệm.' });
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.emit('disconnected', {});
      };
    } catch {
      this.isConnecting = false;
      this.emit('connected', { host: config.name, simulated: true });
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
    onChunk: (chunk: string) => void,
    onThinking: (thinkingChunk: string) => void,
    onToolCall: (tool: ToolCall) => void,
    onComplete: (finalMessage: Partial<Message>) => void
  ) {
    // If live WebSocket is connected and open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'user_prompt',
          content: prompt,
          model: this.hostConfig?.model || 'Gemini 2.5 Flash',
        })
      );
      return;
    }

    // SIMULATED AGENTIC RESPONSE ENGINE (Allows full preview of ChatGPT/Claude UX & Tool Execution)
    const isCommandRequest =
      prompt.toLowerCase().includes('run') ||
      prompt.toLowerCase().includes('build') ||
      prompt.toLowerCase().includes('test') ||
      prompt.toLowerCase().includes('chạy') ||
      prompt.toLowerCase().includes('lệnh') ||
      prompt.toLowerCase().includes('cài');

    const isEditRequest =
      prompt.toLowerCase().includes('sửa') ||
      prompt.toLowerCase().includes('thay đổi') ||
      prompt.toLowerCase().includes('code') ||
      prompt.toLowerCase().includes('file');

    // 1. Thinking phase
    const thoughts = [
      `1. Tiếp nhận prompt từ người dùng: "${prompt}"\n`,
      `2. Đang kiểm tra workspace hiện tại và trạng thái máy chủ...\n`,
      `3. Xác định chiến lược thực thi tối ưu với model ${this.hostConfig?.model || 'Gemini 2.5 Flash'}...\n`,
      `4. Kiểm tra các quy chuẩn kỷ luật an toàn trong PROJECT_RULES.md (No regression, Changelog update)...\n`,
      `5. Chuẩn bị kế hoạch thực thi và phản hồi.\n`,
    ];

    let fullThinking = '';
    for (const step of thoughts) {
      await new Promise((r) => setTimeout(r, 450));
      fullThinking += step;
      onThinking(fullThinking);
    }

    // 2. Tool Execution / Approval Phase (if applicable)
    let generatedTools: ToolCall[] = [];

    if (isCommandRequest) {
      const toolCall: ToolCall = {
        id: 'tc_' + Date.now(),
        name: 'run_command',
        toolSummary: 'Kiểm tra trạng thái hệ thống và thực thi lệnh',
        args: { CommandLine: 'npm run test:fast', WaitMsBeforeAsync: 5000 },
        status: this.hostConfig?.toolPolicy === 'request-review' ? 'requires_approval' : 'running',
        output: '',
      };
      generatedTools.push(toolCall);
      onToolCall(toolCall);

      if (toolCall.status === 'requires_approval') {
        // Paused waiting for user approval banner!
        onComplete({
          content: 'Tôi đã phân tích yêu cầu. Có một lệnh terminal cần được bạn phê duyệt trước khi máy chủ thực thi:',
          thinking: fullThinking,
          toolCalls: generatedTools,
          status: 'pending_approval',
        });
        return;
      }

      await new Promise((r) => setTimeout(r, 900));
      toolCall.status = 'done';
      toolCall.output = 'PASS src/index.test.ts (12 tests passed, 0 failures in 1.4s)\nDone in 1.84s.';
      onToolCall(toolCall);
    } else if (isEditRequest) {
      const toolCall: ToolCall = {
        id: 'tc_' + Date.now(),
        name: 'edit_file',
        toolSummary: 'Cập nhật cấu hình theme và widget',
        args: { Path: 'src/components/Header.tsx' },
        status: 'done',
        output: 'Successfully applied diff to Header.tsx',
        diff: {
          path: 'src/components/Header.tsx',
          target: '<header className="bg-zinc-800">',
          replacement: '<header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">',
        },
      };
      generatedTools.push(toolCall);
      onToolCall(toolCall);
    }

    // 3. Streaming response tokens
    const responseText = `Tôi đã xử lý yêu cầu của bạn trên máy chủ: **"${prompt}"**.\n\n` +
      `✅ Tất cả các tác vụ đã hoàn tất chuẩn xác theo đúng quy tắc kỷ luật.\n` +
      `- Trạng thái máy chủ: **Hoạt động bình thường** (Latency ~12ms)\n` +
      `- Bộ nhớ RAM máy chủ: **38%** | CPU: **14%**\n` +
      `- Đã đồng bộ trạng thái sang **Widget Màn hình chính iOS (WidgetKit)**.`;

    let currentText = '';
    const words = responseText.split(' ');
    for (const word of words) {
      await new Promise((r) => setTimeout(r, 45));
      currentText += (currentText ? ' ' : '') + word;
      onChunk(currentText);
    }

    onComplete({
      content: currentText,
      thinking: fullThinking,
      toolCalls: generatedTools,
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

    await new Promise((r) => setTimeout(r, 1200));

    updatedTool.status = 'done';
    updatedTool.output =
      '✓ Executed with approval:\nPASS tests/security.test.ts\nPASS tests/widget.test.ts\nAll 15 test suites passed! Exit code: 0';
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
