import React, { useState, useEffect } from 'react';
import { X, Server, Sparkles, Shield, RefreshCw, CheckCircle2, Globe, Wifi, Activity } from 'lucide-react';
import { HostConfig } from '../types';
import { FULL_VERSION, BUILD_DATE } from '../version';
import { widgetBridge } from '../services/widgetBridge';
import { storage, DEFAULT_SERVER_URL } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostConfig: HostConfig;
  onUpdateHostConfig: (newConfig: HostConfig) => void;
  onReloadServerData?: () => void;
}

const AVAILABLE_MODELS = [
  'Gemini 2.5 Flash',
  'Gemini 2.0 Pro',
  'Gemini Next (Experimental)',
  'Claude 3.5 Sonnet (Via Antigravity Bridge)',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hostConfig,
  onUpdateHostConfig,
  onReloadServerData,
}) => {
  const [model, setModel] = useState(hostConfig.model);
  const [policy, setPolicy] = useState(hostConfig.toolPolicy);
  const [widgetSynced, setWidgetSynced] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      storage.getServerUrl().then((url) => setServerUrl(url));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (targetUrl = serverUrl) => {
    setPingStatus('testing');
    const start = Date.now();
    try {
      const clean = targetUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${clean}/api/server-info`, { method: 'GET' });
      if (res.ok) {
        const latency = Date.now() - start;
        setPingLatency(latency);
        setPingStatus('success');
      } else {
        setPingStatus('error');
      }
    } catch {
      setPingStatus('error');
    }
  };

  const handleSave = async () => {
    await storage.saveServerUrl(serverUrl);
    const updated = {
      ...hostConfig,
      model,
      toolPolicy: policy,
    };
    onUpdateHostConfig(updated);
    widgetBridge.updateWidgetData({
      hostName: hostConfig.name,
      currentTask: `Model: ${model}`,
    });
    if (onReloadServerData) {
      onReloadServerData();
    }
    onClose();
  };

  const handleSyncWidget = async () => {
    await widgetBridge.updateWidgetData({
      hostName: hostConfig.name,
      isOnline: hostConfig.isConnected,
      currentTask: 'Đã đồng bộ thủ công từ App',
    });
    setWidgetSynced(true);
    setTimeout(() => setWidgetSynced(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-900">Cài Đặt & Trạng Thái Hệ Thống</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Host Server Telemetry Card */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{hostConfig.name}</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Đang trực tuyến
              </span>
            </div>
            <p className="text-xs text-gray-600 font-mono mt-1.5 truncate">{serverUrl}</p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 text-center">
              <div>
                <span className="text-xs text-gray-500 block font-medium">CPU Host</span>
                <span className="text-sm font-mono font-bold text-gray-900">{hostConfig.systemStats?.cpuPercent || 14}%</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block font-medium">RAM Host</span>
                <span className="text-sm font-mono font-bold text-gray-900">{hostConfig.systemStats?.ramPercent || 38}%</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block font-medium">Độ trễ (Ping)</span>
                <span className="text-sm font-mono font-bold text-emerald-600">{pingLatency ? `${pingLatency}ms` : '12ms'}</span>
              </div>
            </div>
          </div>

          {/* Host Server URL Configurator (Essential for Mobile .ipa connection) */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Địa chỉ máy chủ Host (Server URL):</span>
              </label>
              <button
                type="button"
                onClick={() => testConnection()}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-300 hover:bg-blue-100 shadow-xs"
              >
                <Activity className="w-3 h-3" />
                <span>{pingStatus === 'testing' ? 'Đang test...' : 'Kiểm tra'}</span>
              </button>
            </div>

            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.4:5173"
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-blue-600"
            />

            {/* Quick Presets */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setServerUrl('http://192.168.1.4:5173');
                  testConnection('http://192.168.1.4:5173');
                }}
                className="text-[10px] font-medium bg-white hover:bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-300"
              >
                Wi-Fi: 192.168.1.4
              </button>
              <button
                type="button"
                onClick={() => {
                  setServerUrl('http://100.66.18.111:5173');
                  testConnection('http://100.66.18.111:5173');
                }}
                className="text-[10px] font-medium bg-white hover:bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-300"
              >
                Tailscale: 100.66.18.111
              </button>
              <button
                type="button"
                onClick={() => {
                  setServerUrl('http://localhost:5173');
                  testConnection('http://localhost:5173');
                }}
                className="text-[10px] font-medium bg-white hover:bg-gray-100 text-gray-700 px-2 py-1 rounded-md border border-gray-300"
              >
                Localhost
              </button>
            </div>

            {/* Ping Status Feedback */}
            {pingStatus === 'success' && (
              <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kết nối máy chủ thành công! Độ trễ: {pingLatency}ms</span>
              </div>
            )}
            {pingStatus === 'error' && (
              <div className="text-[11px] text-red-700 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                <X className="w-3.5 h-3.5 text-red-600" />
                <span>Không thể kết nối tới máy chủ. Vui lòng kiểm tra IP và đảm bảo PC đang chạy server.</span>
              </div>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Mô hình AI (Model Active):</span>
            </label>
            <div className="space-y-1.5">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm text-left border transition ${
                    model === m
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{m}</span>
                  {model === m && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Execution Policy */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Chính sách thực thi lệnh (Tool Policy):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPolicy('request-review')}
                className={`p-3 rounded-2xl text-left border transition ${
                  policy === 'request-review'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-sm text-gray-900">Hỏi trước khi chạy</div>
                <div className="text-xs text-gray-500 mt-1">Yêu cầu xác nhận cho mọi lệnh (An toàn)</div>
              </button>

              <button
                onClick={() => setPolicy('always-proceed')}
                className={`p-3 rounded-2xl text-left border transition ${
                  policy === 'always-proceed'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-semibold shadow-sm'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-sm text-gray-900">Tự động chạy</div>
                <div className="text-xs text-gray-500 mt-1">Không cần hỏi lại khi agent gọi tool</div>
              </button>
            </div>
          </div>

          {/* iOS WidgetKit Synchronizer */}
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-900">iOS Home Screen Widget</div>
              <p className="text-xs text-gray-500 mt-0.5">Đồng bộ dữ liệu sang App Group WidgetKit</p>
            </div>
            <button
              onClick={handleSyncWidget}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${widgetSynced ? 'animate-spin' : ''}`} />
              <span>{widgetSynced ? 'Đã đồng bộ!' : 'Làm mới'}</span>
            </button>
          </div>

          {/* Version & Build Info (Rule 3 Compliance) */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Mã phiên bản:</span>
              <span className="text-gray-900 font-bold">{FULL_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày build:</span>
              <span className="text-gray-700">{new Date(BUILD_DATE).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};
