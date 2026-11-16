import { Preferences } from '@capacitor/preferences';
import { HostConfig, Project, Session, Message } from '../types';

const KEYS = {
  HOST_CONFIG: 'ag_host_config',
  PROJECTS: 'ag_projects',
  ACTIVE_PROJECT_ID: 'ag_active_project_id',
  ACTIVE_SESSION_ID: 'ag_active_session_id',
  SESSIONS_PREFIX: 'ag_session_',
};

// Default initial data for demo/testing when launched
const DEFAULT_HOST: HostConfig = {
  id: 'host_pc_server',
  name: 'Dell PC Server (Windows)',
  url: 'wss://antigravity.local:8080/remote',
  token: 'ag_sec_token_998124',
  isConnected: true,
  lastConnectedAt: new Date().toISOString(),
  model: 'Gemini 2.5 Flash',
  toolPolicy: 'request-review',
  remoteLink:
    'https://accounts.google.com/AccountChooser?Email=dien07122012%40gmail.com&continue=https%3A%2F%2Fantigravity.google.com%2Fr%2F3a713708-cef0-49ba-b842-af9504802f6a-v2',
  remoteSessionId: '3a713708-cef0-49ba-b842-af9504802f6a-v2',
  googleAccountEmail: 'dien07122012@gmail.com',
  systemStats: {
    cpuPercent: 18,
    ramPercent: 42,
    platform: 'Windows 11 Pro',
  },
};

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj_antigravity_app',
    name: 'antigravity-app',
    path: 'C:\\Users\\NGUYENDIEN\\Documents\\VSCODE-DELL\\antigravity-app',
    activeSessionId: 'sess_default_1',
    lastActiveAt: new Date().toISOString(),
    filesCount: 42,
  },
  {
    id: 'proj_ecommerce_api',
    name: 'backend-nest-api',
    path: 'C:\\Users\\NGUYENDIEN\\Documents\\VSCODE-DELL\\backend-nest-api',
    activeSessionId: 'sess_default_2',
    lastActiveAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    filesCount: 128,
  },
  {
    id: 'proj_ai_crawler',
    name: 'python-data-crawler',
    path: 'C:\\Users\\NGUYENDIEN\\Documents\\VSCODE-DELL\\python-data-crawler',
    lastActiveAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    filesCount: 19,
  },
];

const DEFAULT_SESSION: Session = {
  id: 'sess_default_1',
  projectId: 'proj_antigravity_app',
  title: 'Xây dựng Antigravity Mobile App',
  createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
  messages: [
    {
      id: 'm1',
      role: 'user',
      content: 'Tôi muốn xây dựng ứng dụng mobile companion cho Antigravity để điều khiển PC từ xa qua mã QR Remote Control.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'm2',
      role: 'assistant',
      content: 'Chào bạn! Tôi đã phân tích kiến trúc Antigravity Remote Control. Ứng dụng mobile sẽ kết nối qua WebSocket an toàn, hỗ trợ quét mã QR một chạm và cung cấp giao diện tương tự ChatGPT / Claude mobile để bạn điều khiển server từ xa.',
      createdAt: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
      thinking: 'Phân tích yêu cầu từ người dùng:\n1. Ứng dụng mobile cho iOS sideload (.ipa).\n2. Giao diện trực quan như ChatGPT/Claude.\n3. Hỗ trợ quét mã QR Remote Control.\n4. Tích hợp Widget màn hình chính iOS (WidgetKit).\n5. Tuân thủ nghiêm ngặt quy tắc bảo toàn phạm vi và Changelog.',
      toolCalls: [
        {
          id: 't1',
          name: 'read_file',
          toolSummary: 'Kiểm tra tài liệu Antigravity Guide',
          args: { Path: 'C:/Users/NGUYENDIEN/.gemini/antigravity/builtin/skills/antigravity_guide/SKILL.md' },
          output: 'Found official Antigravity Remote specs & WebSocket endpoints.',
          status: 'done',
        },
        {
          id: 't2',
          name: 'run_command',
          toolSummary: 'Khởi tạo cấu trúc dự án & sync iOS platform',
          args: { CommandLine: 'npx cap add ios; node scripts/bump-build.js' },
          output: '√ Adding native Xcode project in ios in 126ms\n√ Copying web assets from dist to ios/App/App/public\n[Version] Updated to: v1.0.0 (Build 1)',
          status: 'done',
        },
      ],
      artifacts: [
        {
          id: 'art_1',
          title: 'Kế hoạch phát triển Antigravity Mobile',
          summary: 'Bản đề xuất kiến trúc, phân vùng tính năng và lộ trình phát triển iOS IPA.',
          path: 'C:/Users/NGUYENDIEN/.gemini/antigravity/brain/antigravity-mobile-plan.md',
          content: '# Antigravity Mobile Architecture Plan\n\n- React + TypeScript + Capacitor\n- Native iOS WidgetKit (Swift)\n- Real-time WebSocket Remote Control',
        },
      ],
      status: 'done',
    },
  ],
};

export const storage = {
  async getHostConfig(): Promise<HostConfig> {
    try {
      const { value } = await Preferences.get({ key: KEYS.HOST_CONFIG });
      return value ? JSON.parse(value) : DEFAULT_HOST;
    } catch {
      return DEFAULT_HOST;
    }
  },

  async saveHostConfig(config: HostConfig): Promise<void> {
    await Preferences.set({
      key: KEYS.HOST_CONFIG,
      value: JSON.stringify(config),
    });
  },

  async getProjects(): Promise<Project[]> {
    try {
      const { value } = await Preferences.get({ key: KEYS.PROJECTS });
      return value ? JSON.parse(value) : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  },

  async saveProjects(projects: Project[]): Promise<void> {
    await Preferences.set({
      key: KEYS.PROJECTS,
      value: JSON.stringify(projects),
    });
  },

  async getActiveProjectId(): Promise<string> {
    try {
      const { value } = await Preferences.get({ key: KEYS.ACTIVE_PROJECT_ID });
      return value || DEFAULT_PROJECTS[0].id;
    } catch {
      return DEFAULT_PROJECTS[0].id;
    }
  },

  async setActiveProjectId(id: string): Promise<void> {
    await Preferences.set({ key: KEYS.ACTIVE_PROJECT_ID, value: id });
  },

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const { value } = await Preferences.get({ key: KEYS.SESSIONS_PREFIX + sessionId });
      if (value) return JSON.parse(value);
      if (sessionId === DEFAULT_SESSION.id) return DEFAULT_SESSION;
      return null;
    } catch {
      return sessionId === DEFAULT_SESSION.id ? DEFAULT_SESSION : null;
    }
  },

  async saveSession(session: Session): Promise<void> {
    await Preferences.set({
      key: KEYS.SESSIONS_PREFIX + session.id,
      value: JSON.stringify(session),
    });
  },

  async getAllSessionsForProject(projectId: string): Promise<Session[]> {
    // 1. First attempt to fetch real server sessions from Antigravity Brain on PC!
    try {
      const realSessions = await this.fetchRealServerSessions();
      if (realSessions.length > 0) {
        return realSessions;
      }
    } catch {}

    // 2. Fallback to cached or starter sessions
    if (projectId === DEFAULT_PROJECTS[0].id) {
      const current = await this.getSession(DEFAULT_SESSION.id);
      return current ? [current] : [DEFAULT_SESSION];
    }
    return [];
  },

  async fetchServerInfo(): Promise<any> {
    try {
      const res = await fetch('/api/server-info');
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async fetchRealServerSessions(): Promise<Session[]> {
    try {
      const res = await fetch('/api/real-sessions');
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map((s: any) => ({
            id: s.id,
            projectId: s.projectId || 'proj_antigravity_app',
            title: s.title,
            createdAt: s.createdAt || new Date().toISOString(),
            updatedAt: s.updatedAt || new Date().toISOString(),
            messages: [],
          }));
        }
      }
    } catch {}
    return [];
  },

  async fetchRealTranscript(sessionId: string): Promise<Message[]> {
    try {
      const res = await fetch(`/api/real-transcript/${sessionId}`);
      if (res.ok) {
        const messages = await res.json();
        if (Array.isArray(messages)) return messages;
      }
    } catch {}
    return [];
  },
};
