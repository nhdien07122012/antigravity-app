import { Preferences } from '@capacitor/preferences';

export interface WidgetData {
  hostName: string;
  isOnline: boolean;
  activeProject: string;
  currentTask: string;
  pendingApprovalsCount: number;
  lastUpdated: string;
  cpuUsage: number;
  memoryUsage: number;
}

export const widgetBridge = {
  async updateWidgetData(data: Partial<WidgetData>): Promise<void> {
    try {
      const existing = await this.getWidgetData();
      const merged: WidgetData = {
        hostName: data.hostName ?? existing.hostName,
        isOnline: data.isOnline ?? existing.isOnline,
        activeProject: data.activeProject ?? existing.activeProject,
        currentTask: data.currentTask ?? existing.currentTask,
        pendingApprovalsCount: data.pendingApprovalsCount ?? existing.pendingApprovalsCount,
        lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        cpuUsage: data.cpuUsage ?? existing.cpuUsage,
        memoryUsage: data.memoryUsage ?? existing.memoryUsage,
      };

      await Preferences.set({
        key: 'antigravity_widget_data',
        value: JSON.stringify(merged),
      });

      console.log('[WidgetKit] Data updated for iOS Home Screen Widget:', merged);
    } catch (e) {
      console.warn('[WidgetKit] Failed to sync data to widget:', e);
    }
  },

  async getWidgetData(): Promise<WidgetData> {
    try {
      const { value } = await Preferences.get({ key: 'antigravity_widget_data' });
      if (value) return JSON.parse(value);
    } catch {}

    return {
      hostName: 'Dell PC Server',
      isOnline: true,
      activeProject: 'antigravity-app',
      currentTask: 'Sẵn sàng nhận lệnh',
      pendingApprovalsCount: 0,
      lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      cpuUsage: 14,
      memoryUsage: 38,
    };
  },
};
