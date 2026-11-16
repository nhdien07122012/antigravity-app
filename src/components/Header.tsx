import React from 'react';
import { Menu, QrCode, Cpu, ShieldCheck } from 'lucide-react';
import { HostConfig, Project } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenQRScanner: () => void;
  onOpenSettings: () => void;
  onOpenWidgetPreview: () => void;
  activeProject: Project | null;
  hostConfig: HostConfig;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenQRScanner,
  onOpenSettings,
  onOpenWidgetPreview,
  activeProject,
  hostConfig,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 pt-3 pb-2.5 bg-[#09090b]/90 backdrop-blur-md border-b border-[#27272a] select-none">
      {/* Left: Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-zinc-300 hover:text-white rounded-lg active:bg-zinc-800 transition"
          aria-label="Mở Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Center: Active Project & Model Badge */}
      <div className="flex flex-col items-center cursor-pointer" onClick={onOpenSettings}>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-zinc-100 max-w-[160px] truncate">
            {activeProject ? activeProject.name : 'Antigravity'}
          </span>
          <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.5 rounded-full border border-blue-500/30">
            {hostConfig.model}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="max-w-[140px] truncate">{hostConfig.name}</span>
        </div>
      </div>

      {/* Right: Actions (Widget Preview, QR Scanner, Host Status) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenWidgetPreview}
          title="Xem thử Widget iOS"
          className="p-2 text-zinc-300 hover:text-amber-400 rounded-lg active:bg-zinc-800 transition"
        >
          <Cpu className="w-4 h-4 text-amber-400/90" />
        </button>

        <button
          onClick={onOpenQRScanner}
          title="Quét QR Kết nối Remote"
          className="p-2 text-zinc-300 hover:text-blue-400 rounded-lg active:bg-zinc-800 transition"
        >
          <QrCode className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Cài đặt hệ thống"
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg active:bg-zinc-800 transition"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </header>
  );
};
