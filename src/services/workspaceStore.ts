import { Preferences } from '@capacitor/preferences';
import { RemoteWorkspace, AppSettings } from '../types';

const KEYS = {
  WORKSPACES: 'ag_remote_workspaces',
  ACTIVE_ID: 'ag_active_workspace_id',
  SETTINGS: 'ag_app_settings',
};

const DEFAULT_WORKSPACE: RemoteWorkspace = {
  id: 'ws_antigravity_app',
  name: 'antigravity-app',
  url: 'https://antigravity.google.com',
  sessionId: undefined,
  accountEmail: 'dien07122012@gmail.com',
  createdAt: new Date().toISOString(),
  lastAccessedAt: new Date().toISOString(),
  iconColor: '#2563eb',
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultGoogleEmail: 'dien07122012@gmail.com',
  autoFullscreen: false,
  hapticFeedback: true,
  keepAliveInMemory: true,
};

const COLOR_PALETTE = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777'];

export const workspaceStore = {
  parseGoogleRemoteUrl(rawUrl: string): { url: string; sessionId?: string; email?: string; suggestedName?: string } {
    let clean = rawUrl.trim();
    let sessionId: string | undefined;
    let email: string | undefined;
    let suggestedName: string | undefined;

    try {
      const parsed = new URL(clean);

      // Check AccountChooser continue parameter
      if (parsed.searchParams.has('continue')) {
        const cont = parsed.searchParams.get('continue') || '';
        const contMatch = cont.match(/\/r\/([a-zA-Z0-9\-_]+)/);
        if (contMatch) sessionId = contMatch[1];
      }

      // Check direct /r/ URL
      const directMatch = clean.match(/\/r\/([a-zA-Z0-9\-_]+)/);
      if (directMatch) sessionId = directMatch[1];

      // Check Email param
      if (parsed.searchParams.has('Email')) {
        email = parsed.searchParams.get('Email') || undefined;
      }

      if (sessionId) {
        suggestedName = `Dự án (${sessionId.slice(0, 8)})`;
      }
    } catch {
      // If it doesn't parse as valid URL, return as-is
    }

    return {
      url: clean,
      sessionId,
      email,
      suggestedName: suggestedName || 'Dự án mới',
    };
  },

  async getWorkspaces(): Promise<RemoteWorkspace[]> {
    try {
      const { value } = await Preferences.get({ key: KEYS.WORKSPACES });
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let migrated = false;
          for (const item of parsed) {
            if (item.url && item.url.includes('3a713708-cef0-49ba-b842-af9504802f6a-v2')) {
              item.url = 'https://antigravity.google.com';
              item.sessionId = undefined;
              migrated = true;
            }
          }
          if (migrated) {
            await Preferences.set({ key: KEYS.WORKSPACES, value: JSON.stringify(parsed) });
          }
          return parsed;
        }
      }
      return [DEFAULT_WORKSPACE];
    } catch {
      return [DEFAULT_WORKSPACE];
    }
  },

  async saveWorkspaces(workspaces: RemoteWorkspace[]): Promise<void> {
    await Preferences.set({
      key: KEYS.WORKSPACES,
      value: JSON.stringify(workspaces),
    });
  },

  async getActiveWorkspaceId(): Promise<string> {
    try {
      const { value } = await Preferences.get({ key: KEYS.ACTIVE_ID });
      return value || DEFAULT_WORKSPACE.id;
    } catch {
      return DEFAULT_WORKSPACE.id;
    }
  },

  async setActiveWorkspaceId(id: string): Promise<void> {
    await Preferences.set({ key: KEYS.ACTIVE_ID, value: id });
  },

  async addWorkspace(rawUrl: string, customName?: string): Promise<RemoteWorkspace> {
    const list = await this.getWorkspaces();
    const parsed = this.parseGoogleRemoteUrl(rawUrl);

    // If session ID already exists in another tab, update its lastAccessedAt
    const existingIndex = list.findIndex(
      (w) => (parsed.sessionId && w.sessionId === parsed.sessionId) || w.url === parsed.url
    );

    if (existingIndex >= 0) {
      list[existingIndex].lastAccessedAt = new Date().toISOString();
      if (customName) list[existingIndex].name = customName;
      await this.saveWorkspaces(list);
      await this.setActiveWorkspaceId(list[existingIndex].id);
      return list[existingIndex];
    }

    const randomColor = COLOR_PALETTE[list.length % COLOR_PALETTE.length];
    const newWs: RemoteWorkspace = {
      id: 'ws_' + Date.now(),
      name: customName || parsed.suggestedName || `Dự án ${list.length + 1}`,
      url: parsed.url,
      sessionId: parsed.sessionId,
      accountEmail: parsed.email,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      iconColor: randomColor,
    };

    list.push(newWs);
    await this.saveWorkspaces(list);
    await this.setActiveWorkspaceId(newWs.id);
    return newWs;
  },

  async removeWorkspace(id: string): Promise<RemoteWorkspace[]> {
    const list = await this.getWorkspaces();
    const filtered = list.filter((w) => w.id !== id);
    const result = filtered.length > 0 ? filtered : [DEFAULT_WORKSPACE];
    await this.saveWorkspaces(result);

    const activeId = await this.getActiveWorkspaceId();
    if (activeId === id) {
      await this.setActiveWorkspaceId(result[0].id);
    }
    return result;
  },

  async updateWorkspace(updated: RemoteWorkspace): Promise<void> {
    const list = await this.getWorkspaces();
    const index = list.findIndex((w) => w.id === updated.id);
    if (index >= 0) {
      list[index] = { ...updated, lastAccessedAt: new Date().toISOString() };
      await this.saveWorkspaces(list);
    }
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const { value } = await Preferences.get({ key: KEYS.SETTINGS });
      return value ? JSON.parse(value) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await Preferences.set({
      key: KEYS.SETTINGS,
      value: JSON.stringify(settings),
    });
  },
};
