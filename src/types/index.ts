export interface RemoteWorkspace {
  id: string;
  name: string;
  url: string;
  sessionId?: string;
  accountEmail?: string;
  createdAt: string;
  lastAccessedAt: string;
  iconColor?: string;
}

export interface AppSettings {
  defaultGoogleEmail: string;
  autoFullscreen: boolean;
  hapticFeedback: boolean;
  keepAliveInMemory: boolean;
}
