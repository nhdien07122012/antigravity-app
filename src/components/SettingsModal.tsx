import React, { useState, useEffect } from 'react';
import { X, Sparkles, Smartphone, Check, RefreshCw, Info, ShieldCheck, Mail } from 'lucide-react';
import { AppSettings } from '../types';
import { FULL_VERSION, BUILD_DATE } from '../version';
import { workspaceStore } from '../services/workspaceStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultGoogleEmail: 'dien07122012@gmail.com',
    autoFullscreen: false,
    hapticFeedback: true,
    keepAliveInMemory: true,
  });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      workspaceStore.getSettings().then(setSettings);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    await workspaceStore.saveSettings(settings);
    setIsSaved(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleReset = async () => {
    if (window.confirm('Khôi phục danh sách dự án về mặc định?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Cài Đặt Ứng Dụng</h3>
              <p className="text-xs text-gray-500">Bộ chứa đa dự án Google Antigravity Remote</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Google Account */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Google Mặc Định</span>
            </label>
            <input
              type="email"
              value={settings.defaultGoogleEmail}
              onChange={(e) => setSettings({ ...settings, defaultGoogleEmail: e.target.value })}
              placeholder="ví dụ: dien07122012@gmail.com"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition"
            />
            <p className="text-[11px] text-gray-400">
              Dùng để tự động điền AccountChooser khi ghép nối dự án từ link hoặc mã QR.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Tuỳ Chọn Vận Hành
            </label>

            {/* Zero-Reload Memory Keep-Alive */}
            <div className="flex items-start justify-between p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Duy Trì Đa Dự Án Trong Bộ Nhớ (Zero-Reload)</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Giữ tất cả iframe dự án chạy ngầm trong RAM, chuyển tab tức thì 0ms, không bao giờ ngắt kết nối WebSocket/Remote.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.keepAliveInMemory}
                onChange={(e) => setSettings({ ...settings, keepAliveInMemory: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Auto Fullscreen */}
            <div className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Tự động toàn màn hình</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ẩn thanh dock chuyển tab khi mở dự án để có tối đa diện tích màn hình.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFullscreen}
                onChange={(e) => setSettings({ ...settings, autoFullscreen: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>

            {/* Haptic feedback */}
            <div className="flex items-start justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">Rung phản hồi (Haptics)</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rung nhẹ khi quét QR thành công hoặc bấm chuyển đổi dự án.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => setSettings({ ...settings, hapticFeedback: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded-md focus:ring-blue-500 mt-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Version Info & Cache */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Phiên bản: {FULL_VERSION}</p>
              <p className="text-[11px] text-gray-400">Build: {BUILD_DATE}</p>
            </div>
            <button
              onClick={handleReset}
              className="text-red-500 hover:text-red-700 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-red-50 transition"
            >
              Đặt lại dữ liệu
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSaved ? 'Đã Lưu!' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
