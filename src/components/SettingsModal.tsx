import React from 'react';
import { X, Server, Cpu, Shield, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { HostConfig } from '../types';
import { FULL_VERSION, BUILD_DATE } from '../version';
import { widgetBridge } from '../services/widgetBridge';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostConfig: HostConfig;
  onUpdateHostConfig: (newConfig: HostConfig) => void;
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
}) => {
  const [model, setModel] = React.useState(hostConfig.model);
  const [policy, setPolicy] = React.useState(hostConfig.toolPolicy);
  const [widgetSynced, setWidgetSynced] = React.useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
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
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-2xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-zinc-100">Cài Đặt & Trạng Thái Hệ Thống</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Host Server Telemetry Card */}
          <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">{hostConfig.name}</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Đã kết nối
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono mt-1 truncate">{hostConfig.url}</p>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-800/80 text-center">
              <div>
                <span className="text-[10px] text-zinc-500 block">CPU Host</span>
                <span className="text-xs font-mono font-bold text-zinc-200">{hostConfig.systemStats?.cpuPercent || 14}%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">RAM Host</span>
                <span className="text-xs font-mono font-bold text-zinc-200">{hostConfig.systemStats?.ramPercent || 38}%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Độ trễ (Ping)</span>
                <span className="text-xs font-mono font-bold text-emerald-400">12ms</span>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Mô hình AI (Model Active):</span>
            </label>
            <div className="space-y-1.5">
              {AVAILABLE_MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left border transition ${
                    model === m
                      ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{m}</span>
                  {model === m && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Tool Execution Policy */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chính sách thực thi lệnh (Tool Policy):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPolicy('request-review')}
                className={`p-2.5 rounded-xl text-xs text-left border transition ${
                  policy === 'request-review'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-medium'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="font-semibold text-zinc-200">Hỏi trước khi chạy</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Yêu cầu xác nhận cho mọi lệnh (An toàn)</div>
              </button>

              <button
                onClick={() => setPolicy('always-proceed')}
                className={`p-2.5 rounded-xl text-xs text-left border transition ${
                  policy === 'always-proceed'
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-medium'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="font-semibold text-zinc-200">Tự động chạy</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Không cần hỏi lại khi agent gọi tool</div>
              </button>
            </div>
          </div>

          {/* iOS WidgetKit Synchronizer */}
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>iOS Home Screen Widget</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">Đồng bộ dữ liệu sang App Group WidgetKit</p>
            </div>
            <button
              onClick={handleSyncWidget}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition"
            >
              <RefreshCw className={`w-3 h-3 ${widgetSynced ? 'animate-spin' : ''}`} />
              <span>{widgetSynced ? 'Đã đồng bộ!' : 'Làm mới'}</span>
            </button>
          </div>

          {/* Version & Build Info (Rule 3 Compliance) */}
          <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-900 text-[11px] text-zinc-500 font-mono space-y-1">
            <div className="flex justify-between">
              <span>Mã phiên bản:</span>
              <span className="text-zinc-300 font-bold">{FULL_VERSION}</span>
            </div>
            <div className="flex justify-between">
              <span>Ngày build:</span>
              <span className="text-zinc-400">{new Date(BUILD_DATE).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#0e0e11] flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
          >
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  );
};
