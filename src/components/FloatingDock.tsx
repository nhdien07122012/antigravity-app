import React, { useState } from 'react';
import {
  Plus,
  Layers,
  Maximize2,
  Minimize2,
  Settings,
  X,
  ChevronUp,
  ChevronDown,
  Folder,
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
  const [isExpanded, setIsExpanded] = useState(true);

  if (isFullscreen) {
    return (
      <button
        onClick={onToggleFullscreen}
        title="Hiển thị thanh chuyển dự án"
        className="fixed bottom-[calc(14px+env(safe-area-inset-bottom,0px))] right-4 z-40 p-3 bg-black/75 hover:bg-black text-white rounded-full shadow-2xl backdrop-blur-md border border-white/20 active:scale-95 transition"
      >
        <Minimize2 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[calc(10px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-3 flex flex-col items-center pointer-events-none select-none">
      {/* Main Floating Capsule */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl shadow-2xl p-1.5 flex items-center justify-between gap-1.5 pointer-events-auto">
        {/* Left: Tab Switcher Scroll Container */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <div
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl cursor-pointer text-xs font-bold transition shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? '#ffffff' : ws.iconColor || '#2563eb' }}
                />
                <span className="max-w-[110px] truncate">{ws.name}</span>

                {workspaces.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseWorkspace(ws.id);
                    }}
                    className={`p-0.5 rounded-md hover:bg-black/10 transition shrink-0 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions: Add Project, Fullscreen, Manage, Settings */}
        <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-gray-200">
          {/* Add Project via QR */}
          <button
            onClick={onOpenScanner}
            title="Quét thêm mã QR Dự án mới"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 shadow-xs transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Thêm</span>
          </button>

          {/* Manage Tabs */}
          <button
            onClick={onOpenManageWorkspaces}
            title="Quản lý danh sách dự án"
            className="p-1.5 text-gray-600 hover:text-black rounded-xl hover:bg-gray-100 transition"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title="Toàn màn hình"
            className="p-1.5 text-gray-600 hover:text-black rounded-xl hover:bg-gray-100 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Cài đặt hệ thống"
            className="p-1.5 text-gray-600 hover:text-black rounded-xl hover:bg-gray-100 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
