import React from 'react';
import { X, Sparkles, Terminal, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';
import { HostConfig, Project } from '../types';

interface WidgetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostConfig: HostConfig;
  activeProject: Project | null;
  pendingApprovalsCount: number;
}

export const WidgetPreviewModal: React.FC<WidgetPreviewModalProps> = ({
  isOpen,
  onClose,
  hostConfig,
  activeProject,
  pendingApprovalsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#121215] border border-zinc-800 rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0e0e11]">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Mô Phỏng Widget Màn Hình Chính iOS</h3>
            <p className="text-[11px] text-zinc-400">Xem trước giao diện WidgetKit (SwiftUI) trên iPhone</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#09090b]">
          {/* Note explaining Swift WidgetKit */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-2xl text-xs text-blue-300">
            💡 Dưới đây là giao diện được kết xuất bởi module **Swift / SwiftUI WidgetKit** trong thư mục `ios/App/AntigravityWidget`. Dữ liệu được đồng bộ từ App chính qua **iOS App Group**.
          </div>

          {/* 1. Medium Widget (Kích thước Vừa - 2x4) */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              1. Medium Widget (Màn hình chính)
            </span>
            <div className="w-full h-36 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/90 p-3.5 flex flex-col justify-between shadow-xl relative overflow-hidden">
              {/* Background subtle glow */}
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />

              {/* Widget Top Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-zinc-100">Antigravity Host</span>
                    <span className="text-[10px] text-zinc-400 block -mt-0.5">{hostConfig.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-400">ONLINE</span>
                </div>
              </div>

              {/* Widget Middle Info */}
              <div className="my-1 py-1.5 px-2.5 bg-zinc-950/80 rounded-xl border border-zinc-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-mono text-zinc-300 truncate">
                    {activeProject ? activeProject.name : 'antigravity-app'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                  CPU: {hostConfig.systemStats?.cpuPercent || 14}% | RAM: {hostConfig.systemStats?.ramPercent || 38}%
                </span>
              </div>

              {/* Widget Bottom Action / Pending Approvals */}
              <div className="flex items-center justify-between text-[11px]">
                {pendingApprovalsCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{pendingApprovalsCount} lệnh đang chờ duyệt!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Agent sẵn sàng</span>
                  </div>
                )}
                <span className="text-[10px] text-zinc-400 font-mono">
                  Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Small Widget (Kích thước Nhỏ - 2x2) */}
          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                2. Small Widget (2x2)
              </span>
              <div className="w-36 h-36 rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-3 flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Máy chủ</span>
                  <div className="text-xs font-bold text-zinc-100 truncate">{hostConfig.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">● Đang kết nối</div>
                </div>

                <div className="pt-1.5 border-t border-zinc-800/80 flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>RAM: 38%</span>
                  <span>12ms</span>
                </div>
              </div>
            </div>

            {/* 3. Lock Screen Widget (Màn hình khóa) */}
            <div className="flex-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                3. Lock Screen (Khóa)
              </span>
              <div className="w-36 h-36 rounded-3xl bg-zinc-950 border border-zinc-800 p-3 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-1">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-[11px] font-bold text-zinc-200">AGY: IDLE</span>
                <span className="text-[9px] text-zinc-400 font-mono mt-0.5">Server OK (0 tasks)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-[#0e0e11] text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition"
          >
            Đóng Mô Phỏng
          </button>
        </div>
      </div>
    </div>
  );
};
