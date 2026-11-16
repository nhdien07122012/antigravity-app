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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Mô Phỏng Widget Màn Hình iOS</h3>
            <p className="text-xs text-gray-500 mt-0.5">Xem trước giao diện WidgetKit (SwiftUI) trên iPhone</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#f9fafb]">
          {/* Note explaining Swift WidgetKit */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm text-blue-900 leading-relaxed font-medium">
            💡 Giao diện này được render trực tiếp bởi module <b>SwiftUI WidgetKit</b> (trong <code>ios/App/AntigravityWidget</code>). Dữ liệu được đồng bộ liên tục qua <b>iOS App Group</b>.
          </div>

          {/* 1. Medium Widget (Kích thước Vừa - 2x4) */}
          <div>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
              1. Medium Widget (Màn hình chính 2x4)
            </span>
            <div className="w-full h-38 rounded-3xl bg-white border border-gray-200 p-4 flex flex-col justify-between shadow-lg relative overflow-hidden">
              {/* Widget Top Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900">Antigravity Host</span>
                    <span className="text-xs text-gray-500 block -mt-0.5 font-medium">{hostConfig.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">ONLINE</span>
                </div>
              </div>

              {/* Widget Middle Info */}
              <div className="my-1.5 py-2 px-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs sm:text-[13px]">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-mono font-bold text-gray-800 truncate">
                    {activeProject ? activeProject.name : 'antigravity-app'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 font-mono font-semibold shrink-0">
                  CPU: {hostConfig.systemStats?.cpuPercent || 14}% | RAM: {hostConfig.systemStats?.ramPercent || 38}%
                </span>
              </div>

              {/* Widget Bottom Action / Pending Approvals */}
              <div className="flex items-center justify-between text-xs sm:text-[13px]">
                {pendingApprovalsCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>{pendingApprovalsCount} lệnh đang chờ duyệt!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Agent sẵn sàng</span>
                  </div>
                )}
                <span className="text-xs text-gray-400 font-mono">
                  Cập nhật: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Small Widget (Kích thước Nhỏ - 2x2) */}
          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                2. Small Widget (2x2)
              </span>
              <div className="w-full h-36 rounded-3xl bg-white border border-gray-200 p-3.5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">MÁY CHỦ</span>
                  <div className="text-sm font-bold text-gray-900 truncate">{hostConfig.name}</div>
                  <div className="text-xs text-emerald-600 font-semibold mt-0.5">● Đang kết nối</div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between text-xs font-mono text-gray-500 font-medium">
                  <span>RAM: 38%</span>
                  <span>12ms</span>
                </div>
              </div>
            </div>

            {/* 3. Lock Screen Widget (Màn hình khóa) */}
            <div className="flex-1">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">
                3. Lock Screen (Khóa)
              </span>
              <div className="w-full h-36 rounded-3xl bg-white border border-gray-200 p-3.5 flex flex-col items-center justify-center text-center shadow-lg">
                <div className="w-11 h-11 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-1 bg-emerald-50">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-gray-900 mt-1">AGY: READY</span>
                <span className="text-[10px] text-gray-500 font-mono">0 pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Đóng Mô Phỏng
          </button>
        </div>
      </div>
    </div>
  );
};
