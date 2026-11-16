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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-[85%] max-w-[320px] bg-white border-r border-gray-200 h-full flex flex-col justify-between z-10 shadow-2xl">
        {/* Top: Header & Project Switcher */}
        <div className="p-3.5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base tracking-tight text-gray-900">Antigravity Mobile</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg active:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left transition shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {activeProj ? activeProj.name : 'Chọn dự án'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
            </button>

            {showProjectPicker && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20">
                <div className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Dự án trên Host Server
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setShowProjectPicker(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition ${
                      p.id === activeProjectId
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FolderCode className="w-4 h-4 text-blue-500" />
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
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                <span>Phiên trên Server ({sessions.length})</span>
              </div>
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-bold shadow-inner'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="truncate flex-1">{sess.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: QR Connect, Settings & Mandatory UI Version Tag (Rule 3) */}
        <div className="p-3.5 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={() => {
              onOpenQRScanner();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-200/60 rounded-xl transition"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Quét mã QR kết nối Host</span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-200/60 rounded-xl transition"
          >
            <Settings className="w-4 h-4 text-gray-600" />
            <span>Cài đặt & Máy chủ</span>
          </button>

          {/* UI VERSION TAG (Rule 3 Compliance) */}
          <div className="pt-2 mt-1 border-t border-gray-200 flex items-center justify-between px-1 text-xs text-gray-500 font-mono">
            <span>Phiên bản:</span>
            <span className="version-tag px-2.5 py-0.5 rounded-full bg-white text-gray-800 font-bold border border-gray-300 shadow-sm">
              {FULL_VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
