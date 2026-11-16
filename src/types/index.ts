export interface Project {
  id: string;
  name: string;
  path: string;
  activeSessionId?: string;
  lastActiveAt: string;
  filesCount?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  toolSummary?: string;
  args: Record<string, any>;
  output?: string;
  status: 'running' | 'done' | 'error' | 'requires_approval';
  startTime?: string;
  endTime?: string;
  diff?: {
    path: string;
    target?: string;
    replacement?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  thinking?: string;
  isThinkingOpen?: boolean;
  toolCalls?: ToolCall[];
  status?: 'streaming' | 'done' | 'error' | 'pending_approval';
  artifacts?: {
    id: string;
    title: string;
    summary: string;
    path: string;
    content: string;
  }[];
}

export interface Session {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface HostConfig {
  id: string;
  name: string;
  url: string;
  token: string;
  isConnected: boolean;
  lastConnectedAt?: string;
  model: string;
  toolPolicy: 'always-proceed' | 'request-review' | 'strict';
  remoteLink?: string;
  googleAccountEmail?: string;
  remoteSessionId?: string;
  systemStats?: {
    cpuPercent: number;
    ramPercent: number;
    platform: string;
  };
}

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  badge?: string;
}
