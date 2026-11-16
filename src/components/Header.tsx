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
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 pt-3 pb-2.5 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm select-none">
      {/* Left: Sidebar Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-gray-700 hover:text-black rounded-xl active:bg-gray-100 transition"
          aria-label="Mở Menu"
        >
          <Menu className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Center: Active Project & Model Badge */}
      <div className="flex flex-col items-center cursor-pointer" onClick={onOpenSettings}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-base text-gray-900 max-w-[170px] truncate">
            {activeProject ? activeProject.name : 'Antigravity'}
          </span>
          <span className="text-[11px] bg-blue-50 text-blue-700 font-semibold font-mono px-2 py-0.5 rounded-full border border-blue-200">
            {hostConfig.model}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="max-w-[150px] truncate font-medium">{hostConfig.name}</span>
        </div>
      </div>

      {/* Right: Actions (Widget Preview, QR Scanner, Host Status) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenWidgetPreview}
          title="Xem thử Widget iOS"
          className="p-2 text-amber-600 hover:text-amber-700 rounded-xl active:bg-gray-100 transition"
        >
          <Cpu className="w-5 h-5 stroke-[2]" />
        </button>

        <button
          onClick={onOpenQRScanner}
          title="Quét QR Kết nối Remote"
          className="p-2 text-blue-600 hover:text-blue-700 rounded-xl active:bg-gray-100 transition"
        >
          <QrCode className="w-5 h-5 stroke-[2]" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Cài đặt hệ thống"
          className="p-2 text-emerald-600 hover:text-emerald-700 rounded-xl active:bg-gray-100 transition"
        >
          <ShieldCheck className="w-5 h-5 stroke-[2]" />
        </button>
      </div>
    </header>
  );
};
