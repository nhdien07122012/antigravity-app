import React from 'react';
import {
  Plus,
  Layers,
  Maximize2,
  Minimize2,
  Settings,
  X,
} from 'lucide-react';
import { RemoteWorkspace } from '../types';

interface FloatingDockProps {
  workspaces: RemoteWorkspace[];
  activeId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenScanner: () => void;
  onOpenManageWorkspaces: () => void;
  onOpenSettings: () => void;
  onCloseWorkspace: (id: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  workspaces,
  activeId,
  onSelectWorkspace,
  onOpenScanner,
  onOpenManageWorkspaces,
  onOpenSettings,
  onCloseWorkspace,
  isFullscreen,
  onToggleFullscreen,
}) => {
  if (isFullscreen) {
    return (
      <button
        onClick={onToggleFullscreen}
        title="Hiển thị thanh chuyển dự án"
        className="fixed bottom-[calc(8px+env(safe-area-inset-bottom,0px))] right-4 z-40 p-2.5 bg-black/80 hover:bg-black text-white rounded-full shadow-2xl backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 active:scale-95 transition"
      >
        <Minimize2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[calc(4px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-3 flex flex-col items-center pointer-events-none select-none">
      {/* Liquid Glass Dynamic Island Capsule */}
      <div className="w-full max-w-md bg-[#0a0a0f]/80 backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.65)] p-1.5 flex items-center justify-between gap-1.5 pointer-events-auto transition-all duration-300">
        {/* Left: Project Tabs Scroll Container */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5 px-0.5">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-xs font-semibold tracking-wide transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/35 ring-1 ring-blue-400/40'
                    : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: isActive ? '#ffffff' : ws.iconColor || '#38bdf8' }}
                />
                <span className="max-w-[110px] truncate">{ws.name}</span>

                {workspaces.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseWorkspace(ws.id);
                    }}
                    className={`p-0.5 rounded-full hover:bg-white/20 transition shrink-0 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions: Add Project, Manage, Fullscreen, Settings */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/15">
          {/* Add Project via QR */}
          <button
            onClick={onOpenScanner}
            title="Quét thêm mã QR Dự án mới"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/25 hover:bg-blue-500/35 text-blue-300 rounded-full text-xs font-bold border border-blue-400/30 shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Thêm</span>
          </button>

          {/* Manage Tabs */}
          <button
            onClick={onOpenManageWorkspaces}
            title="Quản lý danh sách dự án"
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title="Toàn màn hình"
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Cài đặt hệ thống"
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
