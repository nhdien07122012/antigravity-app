import React from 'react';
import {
  X,
  Plus,
  FolderCode,
  MessageSquare,
  QrCode,
  Settings,
  ChevronDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Project, Session } from '../types';
import { FULL_VERSION } from '../version';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onOpenQRScanner: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onOpenQRScanner,
  onOpenSettings,
}) => {
  const [showProjectPicker, setShowProjectPicker] = React.useState(false);
  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-[85%] max-w-[320px] bg-[#121214] border-r border-[#27272a] h-full flex flex-col justify-between z-10 shadow-2xl">
        {/* Top: Header & Project Switcher */}
        <div className="p-3 border-b border-[#27272a]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-wide text-zinc-100">Antigravity Mobile</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md active:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800/80 rounded-xl border border-zinc-800 text-left transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderCode className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-medium text-zinc-200 truncate">
                  {activeProj ? activeProj.name : 'Chọn dự án'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>

            {showProjectPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20">
                <div className="p-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Dự án trên Host Server
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setShowProjectPicker(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition ${
                      p.id === activeProjectId
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <FolderCode className="w-3.5 h-3.5" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 bg-zinc-800/90 hover:bg-zinc-700/90 text-white rounded-xl text-xs font-medium border border-zinc-700/60 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-medium text-zinc-400">
              <Clock className="w-3 h-3" />
              <span>Gần đây</span>
            </div>
            <div className="space-y-1">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <button
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs text-left transition ${
                      isActive
                        ? 'bg-zinc-800 text-white font-medium shadow-inner'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <span className="truncate flex-1">{sess.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: QR Connect, Settings & Mandatory UI Version Tag (Rule 3) */}
        <div className="p-3 border-t border-[#27272a] bg-[#0c0c0e]/80 space-y-1.5">
          <button
            onClick={() => {
              onOpenQRScanner();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-xl transition"
          >
            <QrCode className="w-4 h-4 text-blue-400" />
            <span>Quét mã QR kết nối Host</span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/70 rounded-xl transition"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Cài đặt & Máy chủ</span>
          </button>

          {/* UI VERSION TAG (Rule 3 Compliance) */}
          <div className="pt-2 mt-1 border-t border-zinc-800/60 flex items-center justify-between px-1 text-[11px] text-zinc-400 font-mono">
            <span>Phiên bản:</span>
            <span className="version-tag px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/50">
              {FULL_VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
