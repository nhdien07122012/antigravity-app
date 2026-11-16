import React, { useState } from 'react';
import {
  X,
  Plus,
  FolderCode,
  MessageSquare,
  QrCode,
  Settings,
  ChevronDown,
  ChevronRight,
  Clock,
  Sparkles,
  Search,
  RotateCw,
  FolderOpen,
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
  onRefreshData?: () => void;
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
  onRefreshData,
}) => {
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeProj = projects.find((p) => p.id === activeProjectId) || projects[0];

  if (!isOpen) return null;

  const handleRefresh = async () => {
    if (onRefreshData) {
      setIsRefreshing(true);
      await onRefreshData();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const toggleProjectCollapse = (projectName: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      (s.projectName && s.projectName.toLowerCase().includes(q))
    );
  });

  // Group sessions by project name when viewing all
  const sessionsByProject: Record<string, Session[]> = {};
  if (activeProjectId === 'all_projects') {
    filteredSessions.forEach((s) => {
      const pName = s.projectName || 'Dự án khác';
      if (!sessionsByProject[pName]) sessionsByProject[pName] = [];
      sessionsByProject[pName].push(s);
    });
  }

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
              <div>
                <span className="font-bold text-base tracking-tight text-gray-900 block leading-tight">
                  Antigravity
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Mobile Remote Companion</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onRefreshData && (
                <button
                  onClick={handleRefresh}
                  title="Đồng bộ lại từ máy tính host"
                  className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg active:bg-gray-100 transition"
                >
                  <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg active:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Project Switcher Dropdown */}
          <div className="relative">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
              Dự án đang mở:
            </label>
            <button
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 text-left transition shadow-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 truncate">
                  {activeProj ? activeProj.name : 'Chọn dự án'}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                  {sessions.length}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${showProjectPicker ? 'rotate-180' : ''}`} />
            </button>

            {showProjectPicker && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                <div className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span>Dự án trên Host Server</span>
                  <span>{projects.length}</span>
                </div>
                {projects.map((p) => {
                  const isSelected = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        setShowProjectPicker(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {p.filesCount !== undefined && (
                        <span className={`text-xs px-1.5 py-0.2 rounded-full font-mono shrink-0 ${isSelected ? 'bg-blue-200 text-blue-900 font-bold' : 'bg-gray-100 text-gray-600'}`}>
                          {p.filesCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hội thoại..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full mt-2.5 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Hội thoại mới</span>
          </button>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3">
          {/* Grouped view when viewing 'all_projects' */}
          {activeProjectId === 'all_projects' ? (
            <div className="space-y-3">
              {Object.keys(sessionsByProject).length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  {searchQuery ? 'Không tìm thấy cuộc hội thoại phù hợp' : 'Chưa có cuộc trò chuyện nào'}
                </div>
              ) : (
                Object.entries(sessionsByProject).map(([projName, projSessions]) => {
                  const isCollapsed = collapsedProjects[projName];
                  return (
                    <div key={projName} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      {/* Project Accordion Header */}
                      <button
                        onClick={() => toggleProjectCollapse(projName)}
                        className="w-full flex items-center justify-between px-2.5 py-2 bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          )}
                          <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-xs font-bold text-gray-800 truncate">{projName}</span>
                        </div>
                        <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full font-mono shrink-0">
                          {projSessions.length}
                        </span>
                      </button>

                      {/* Sessions under this project */}
                      {!isCollapsed && (
                        <div className="divide-y divide-gray-100 p-1 space-y-0.5">
                          {projSessions.map((sess) => {
                            const isActive = sess.id === activeSessionId;
                            return (
                              <button
                                key={sess.id}
                                onClick={() => {
                                  onSelectSession(sess.id);
                                  onClose();
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-900 font-bold'
                                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                              >
                                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="truncate flex-1">{sess.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Single project sessions list */
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hội thoại ({filteredSessions.length})</span>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold truncate max-w-[120px]">
                  {activeProj.name}
                </span>
              </div>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  {searchQuery ? 'Không tìm thấy cuộc hội thoại phù hợp' : 'Chưa có phiên chat nào trong dự án này'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredSessions.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    return (
                      <button
                        key={sess.id}
                        onClick={() => {
                          onSelectSession(sess.id);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-xs'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block font-medium">{sess.title}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sess.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: QR Connect, Settings & Mandatory UI Version Tag (Rule 3) */}
        <div className="p-3.5 border-t border-gray-200 bg-gray-50 space-y-2">
          <button
            onClick={() => {
              onOpenQRScanner();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-200/60 rounded-xl transition"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>Quét mã QR kết nối Host</span>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-200/60 rounded-xl transition"
          >
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Cài đặt máy chủ & Mô hình</span>
          </button>

          {/* Mandatory UI Version Tag (Rule 3) */}
          <div className="pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Phiên bản UI:</span>
            <span className="version-tag px-2 py-0.5 bg-gray-200/70 text-gray-700 rounded-md font-bold">
              {FULL_VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
