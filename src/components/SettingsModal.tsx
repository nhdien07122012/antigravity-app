import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  Cog6ToothIcon,
  SparklesIcon,
  CheckIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  BellIcon,
  SpeakerWaveIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { AppSettings } from '../types';
import { FULL_VERSION, BUILD_DATE } from '../version';
import { workspaceStore } from '../services/workspaceStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
  onOpenIpaManager?: () => void;
  onOpenScanner?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
  onOpenIpaManager,
  onOpenScanner,
}) => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultGoogleEmail: 'dien07122012@gmail.com',
    autoFullscreen: false,
    hapticFeedback: true,
    keepAliveInMemory: true,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncOnResume, setAutoSyncOnResume] = useState(true);
  const [dockPosition, setDockPositionState] = useState<'bottom' | 'left' | 'right'>('bottom');
  const [dockDisplayMode, setDockDisplayModeState] = useState<'always' | 'autohide'>('always');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSaved, setIsSaved] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      workspaceStore.getSettings().then(setSettings);
      const savedNotif = localStorage.getItem('ag_notifications_enabled');
      if (savedNotif !== null) {
        setNotificationsEnabled(savedNotif === 'true');
      }
      const savedAutoSync = localStorage.getItem('ag_autosync_enabled');
      if (savedAutoSync !== null) {
        setAutoSyncOnResume(savedAutoSync === 'true');
      }
      const savedPos = localStorage.getItem('ag_dock_position') as 'bottom' | 'left' | 'right' | null;
      if (savedPos) setDockPositionState(savedPos);
      const savedMode = localStorage.getItem('ag_dock_display_mode') as 'always' | 'autohide' | null;
      if (savedMode) setDockDisplayModeState(savedMode);

      setIsSaved(false);
      setTestNotificationStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await workspaceStore.saveSettings(settings);
    localStorage.setItem('ag_notifications_enabled', String(notificationsEnabled));
    localStorage.setItem('ag_autosync_enabled', String(autoSyncOnResume));
    localStorage.setItem('ag_dock_position', dockPosition);
    localStorage.setItem('ag_dock_display_mode', dockDisplayMode);

    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      try {
        (window as any).webkit.messageHandlers.antigravityNative.postMessage({
          action: 'setDockPosition',
          position: dockPosition,
        });
        (window as any).webkit.messageHandlers.antigravityNative.postMessage({
          action: 'setDockDisplayMode',
          mode: dockDisplayMode,
        });
      } catch (e) {}
    }

    setIsSaved(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleReset = async () => {
    if (window.confirm('Khôi phục toàn bộ danh sách dự án và cài đặt về mặc định?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      try {
        (window as any).webkit.messageHandlers.antigravityNative.postMessage('goBack');
      } catch (e) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
    onClose();
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.max(70, Math.min(200, zoomLevel + delta));
    setZoomLevel(newZoom);
    document.body.style.zoom = `${newZoom}%`;
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
    document.body.style.zoom = '100%';
  };

  const handleTestChimeAndNotification = () => {
    setTestNotificationStatus('Đang kích hoạt chuông và thông báo...');
    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      try {
        (window as any).webkit.messageHandlers.antigravityNative.postMessage({
          action: 'conversationFinished',
          projectName: 'antigravity-app',
          title: 'Thử nghiệm kết quả',
        });
      } catch (e) {}
    } else {
      // In web browser preview
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📁 Dự Án: antigravity-app 🎉', {
          body: 'Dự án "antigravity-app" đã hoàn thành phản hồi và tác vụ mới!',
        });
      }
    }
    setTimeout(() => {
      setTestNotificationStatus('Chuông và biểu ngữ đã phát thành công! 🎉');
      setTimeout(() => setTestNotificationStatus(null), 3000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 select-none animate-fadeIn">
      {/* Blurred Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modern Modal Card */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#121217]/95 backdrop-blur-2xl rounded-3xl flex flex-col z-10 shadow-[0_20px_60px_rgba(0,0,0,0.45)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden max-h-[92vh] border border-black/10 dark:border-white/15 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Cog6ToothIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Cài Đặt & Điều Khiển
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {FULL_VERSION}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Menu điều khiển dự án Google Antigravity Remote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-95"
            title="Đóng menu"
          >
            <XMarkIcon className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Section 1: Quick Actions Grid */}
          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Thao Tác Nhanh
            </label>
            <div className="grid grid-cols-4 gap-2">
              {/* Back */}
              <button
                type="button"
                onClick={handleGoBack}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/15 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 transition active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                  <ArrowLeftIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold">Lùi Trang</span>
              </button>

              {/* Reload */}
              <button
                type="button"
                onClick={handleReload}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 transition active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                  <ArrowPathIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold">Tải Lại</span>
              </button>

              {/* Download Manager */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenIpaManager) onOpenIpaManager();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 transition active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                  <ArrowDownTrayIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold">Tải Về</span>
              </button>

              {/* Add Project */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenScanner) onOpenScanner();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-500/15 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 transition active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1 group-hover:scale-105 transition">
                  <QrCodeIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-bold">Quét QR</span>
              </button>
            </div>
          </div>

          {/* Section: Dock Position & Display Mode */}
          <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">Vị Trí & Hiển Thị Dock</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Tùy biến thanh công cụ và chế độ hiển thị</p>
            </div>

            {/* Position Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Vị Trí Dock:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bottom', label: '⬇️ Đáy' },
                  { id: 'left', label: '⬅️ Cạnh Trái' },
                  { id: 'right', label: '➡️ Cạnh Phải' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setDockPositionState(pos.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                      dockPosition === pos.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-black/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Mode Selector */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Chế Độ Hiển Thị:</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'always', label: '👁️ Luôn Hiện' },
                  { id: 'autohide', label: '⏱️ Tự Động Ẩn' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDockDisplayModeState(mode.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                      dockDisplayMode === mode.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-black/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Zoom Stepper */}
          <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <MagnifyingGlassPlusIcon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Cỡ Chữ & Phóng To</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Điều chỉnh tỉ lệ hiển thị giao diện</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-black/30 p-1 rounded-xl border border-gray-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleZoom(-10)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition active:scale-95"
                title="Thu nhỏ (-10%)"
              >
                <MagnifyingGlassMinusIcon className="w-4 h-4 stroke-[2.2]" />
              </button>
              <span className="min-w-[42px] text-center text-xs font-bold text-gray-800 dark:text-white">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(10)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition active:scale-95"
                title="Phóng to (+10%)"
              >
                <MagnifyingGlassPlusIcon className="w-4 h-4 stroke-[2.2]" />
              </button>
              {zoomLevel !== 100 && (
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-1.5 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/20 transition"
                  title="Đặt lại về chuẩn 100%"
                >
                  100%
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Notification & Chime Controls */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
              Thông Báo & Tương Tác
            </label>

            {/* Notification Toggle Card */}
            <div className="flex items-start justify-between p-3.5 bg-purple-50/70 dark:bg-purple-950/25 border border-purple-200/80 dark:border-purple-900/40 rounded-2xl gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <BellIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Thông Báo Hội Thoại Hoàn Thành
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    Phát chuông báo âm thanh, rung nhẹ và hiển thị biểu ngữ khi câu trả lời hoặc tác vụ hoàn tất.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded-md focus:ring-purple-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Auto-Sync on Resume Toggle Card */}
            <div className="flex items-start justify-between p-3.5 bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowPathIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Tự Động Cập Nhật Khi Mở Lại App
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    Tự động đồng bộ tin nhắn và tác vụ mới nhất khi quay lại từ đa nhiệm mà không cần bấm reload thủ công.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoSyncOnResume}
                onChange={(e) => setAutoSyncOnResume(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Test Chime & Toast Button */}
            <button
              type="button"
              onClick={handleTestChimeAndNotification}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 rounded-2xl text-xs font-bold transition active:scale-95"
            >
              <SpeakerWaveIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 stroke-[2.2]" />
              <span>Thử Nghiệm Âm Thanh & Biểu Ngữ Ngay</span>
            </button>

            {testNotificationStatus && (
              <div className="p-2.5 rounded-xl bg-purple-100/80 dark:bg-purple-950/50 text-purple-800 dark:text-purple-200 text-xs font-medium text-center animate-fadeIn">
                {testNotificationStatus}
              </div>
            )}
          </div>

          {/* Section 4: Operational Settings */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider block">
              Cấu Hình & Hiệu Năng
            </label>

            {/* Google Email Input */}
            <div className="p-3.5 bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
                <span>Email Google Mặc Định</span>
              </label>
              <input
                type="email"
                value={settings.defaultGoogleEmail}
                onChange={(e) => setSettings({ ...settings, defaultGoogleEmail: e.target.value })}
                placeholder="dien07122012@gmail.com"
                className="w-full px-3.5 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white transition"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-400">
                Tự động điền tham số tài khoản khi kết nối dự án từ link hoặc mã QR.
              </p>
            </div>

            {/* Zero-Reload Keep-Alive Toggle */}
            <div className="flex items-start justify-between p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheckIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    Duy Trì Đa Dự Án Trong Bộ Nhớ (Zero-Reload)
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    Giữ kết nối WebSocket hoạt động nền, chuyển đổi tức thì 0ms mà không phải tải lại trang.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.keepAliveInMemory}
                onChange={(e) => setSettings({ ...settings, keepAliveInMemory: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Auto Fullscreen */}
            <div className="flex items-start justify-between p-3.5 bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowsPointingOutIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Tự Động Toàn Màn Hình</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Thu gọn thanh dock khi mở dự án để có tối đa không gian màn hình.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFullscreen}
                onChange={(e) => setSettings({ ...settings, autoFullscreen: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Haptic Feedback */}
            <div className="flex items-start justify-between p-3.5 bg-gray-50/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 rounded-2xl gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                  <DevicePhoneMobileIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Rung Phản Hồi (Haptics)</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Rung nhẹ khi thao tác chuyển tab hoặc quét mã QR thành công.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => setSettings({ ...settings, hapticFeedback: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 5: Version & Reset */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 stroke-[2.2]" />
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300">Phiên bản: {FULL_VERSION}</p>
                <p className="text-[10px] text-gray-400">Build ngày: {BUILD_DATE}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition active:scale-95"
            >
              <TrashIcon className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Đặt Lại Dữ Liệu</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-white/10 transition active:scale-95"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition"
          >
            {isSaved ? (
              <CheckIcon className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <SparklesIcon className="w-4 h-4 stroke-[2.2]" />
            )}
            <span>{isSaved ? 'Đã Lưu Thành Công!' : 'Lưu Cài Đặt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
