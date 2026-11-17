import React, { useState } from 'react';
import {
  ArrowLeftIcon,
  PlusIcon,
  Squares2X2Icon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { RemoteWorkspace } from '../types';

interface FloatingDockProps {
  workspaces: RemoteWorkspace[];
  activeId: string;
  onSelectWorkspace: (id: string) => void;
  onOpenScanner: () => void;
  onOpenManageWorkspaces: () => void;
  onOpenSettings: () => void;
  onOpenIpaManager?: () => void;
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
  onOpenIpaManager,
  onCloseWorkspace,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) || workspaces[0];

  const applyZoom = (delta: number) => {
    const newZoom = Math.max(70, Math.min(200, zoomLevel + delta));
    setZoomLevel(newZoom);
    document.body.style.zoom = `${newZoom}%`;
  };

  const resetZoom = () => {
    setZoomLevel(100);
    document.body.style.zoom = '100%';
    setShowZoomMenu(false);
  };

  const handleBack = () => {
    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      try {
        (window as any).webkit.messageHandlers.antigravityNative.postMessage('goBack');
      } catch (e) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  const handleOpenSettings = () => {
    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      try {
        (window as any).webkit.messageHandlers.antigravityNative.postMessage({ action: 'openSettings' });
        return;
      } catch (e) {}
    }
    onOpenSettings();
  };

  if (isFullscreen) {
    return (
      <button
        onClick={onToggleFullscreen}
        title="Hiển thị thanh chuyển dự án"
        className="fixed bottom-[calc(8px+env(safe-area-inset-bottom,0px))] right-4 z-40 p-2 bg-black/80 hover:bg-black text-white rounded-full shadow-2xl backdrop-blur-2xl border border-white/20 ring-1 ring-white/10 active:scale-95 transition"
      >
        <ArrowsPointingInIcon className="w-4 h-4" />
      </button>
    );
  }

  // State 1: Collapsed Mini Dynamic Island Pill (Docked safely in corner)
  if (!isExpanded) {
    return (
      <div className="fixed bottom-[calc(4px+env(safe-area-inset-bottom,0px))] right-3 z-40 select-none">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-[#0a0a0f]/85 hover:bg-white dark:hover:bg-black backdrop-blur-2xl border border-black/10 dark:border-white/20 ring-1 ring-black/5 dark:ring-white/10 rounded-full shadow-lg text-[11px] font-bold text-gray-800 dark:text-white active:scale-95 transition-all"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 animate-pulse"
            style={{ backgroundColor: activeWorkspace?.iconColor || '#2563eb' }}
          />
          <span className="max-w-[100px] truncate">{activeWorkspace?.name || 'Dự án'}</span>
          <ChevronUpIcon className="w-3 h-3 opacity-60" />
        </button>
      </div>
    );
  }

  // State 2: Full Expanded Control Bar
  return (
    <div className="fixed bottom-[calc(4px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 px-2 flex flex-col items-center pointer-events-none select-none">
      {/* Zoom Quick Pill (Floating above dock if open) */}
      {showZoomMenu && (
        <div className="mb-1 px-3 py-1 bg-white/90 dark:bg-black/85 backdrop-blur-2xl border border-black/10 dark:border-white/20 rounded-full shadow-xl flex items-center gap-2 pointer-events-auto text-xs font-bold text-gray-800 dark:text-white">
          <button
            onClick={() => applyZoom(-10)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition"
            title="Thu nhỏ"
          >
            <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[42px] text-center">{zoomLevel}%</span>
          <button
            onClick={() => applyZoom(10)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition"
            title="Phóng to"
          >
            <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
          </button>
          {zoomLevel !== 100 && (
            <button
              onClick={resetZoom}
              className="text-[10px] text-blue-600 dark:text-blue-400 pl-1 border-l border-gray-300 dark:border-gray-700"
            >
              100%
            </button>
          )}
        </div>
      )}

      {/* Liquid Glass Dynamic Island Capsule (Light & Dark Mode) */}
      <div className="w-full max-w-md bg-white/85 dark:bg-[#0a0a0f]/80 backdrop-blur-2xl border border-black/10 dark:border-white/20 ring-1 ring-black/5 dark:ring-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.35)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.65)] p-1 flex items-center justify-between gap-1 pointer-events-auto transition-all duration-300">
        {/* Left: Project Tabs Scroll Container */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5 px-0.5">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <div
                key={ws.id}
                onClick={() => {
                  onSelectWorkspace(ws.id);
                  setIsExpanded(false); // auto-collapse to leave screen clear
                }}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer text-xs font-semibold tracking-wide transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/35 ring-1 ring-blue-400/40'
                    : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-800 dark:text-white/80'
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
                    className={`p-0.5 rounded-full hover:bg-black/15 dark:hover:bg-white/20 transition shrink-0 ${
                      isActive ? 'text-white/80 hover:text-white' : 'text-gray-400 dark:text-white/40 hover:text-white'
                    }`}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions: Back, Add Project, Zoom, IPA Manager, Settings Menu, Manage Tabs, Fullscreen, Collapse */}
        <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-gray-300/60 dark:border-white/15">
          {/* Back Button */}
          <button
            onClick={handleBack}
            title="Quay lại trang trước"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition active:scale-95"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Add Project via QR */}
          <button
            onClick={onOpenScanner}
            title="Quét thêm mã QR Dự án mới"
            className="flex items-center gap-0.5 px-2 py-1 bg-blue-50 dark:bg-blue-500/25 hover:bg-blue-100 dark:hover:bg-blue-500/35 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-400/30 transition active:scale-95"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Thêm</span>
          </button>

          {/* Zoom / Font Size Adjuster */}
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            title="Cỡ chữ & Phóng to trang"
            className={`p-1.5 rounded-full transition ${
              showZoomMenu
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Download & Sideload IPA Manager */}
          <button
            onClick={onOpenIpaManager}
            title="Quản lý & Tải bản cài IPA để Sideload"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Settings Menu */}
          <button
            onClick={handleOpenSettings}
            title="Cài đặt & Điều khiển nâng cao"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Cog6ToothIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Manage Tabs */}
          <button
            onClick={onOpenManageWorkspaces}
            title="Quản lý danh sách dự án"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <Squares2X2Icon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            title="Toàn màn hình"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <ArrowsPointingOutIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsExpanded(false)}
            title="Thu gọn thanh chuyển dự án"
            className="p-1.5 text-gray-600 dark:text-white/70 hover:text-black dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <ChevronDownIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
