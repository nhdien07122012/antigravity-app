import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatCanvas } from './components/ChatCanvas';
import { InputArea } from './components/InputArea';
import { QRScannerModal } from './components/QRScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { ArtifactModal } from './components/ArtifactModal';
import { WidgetPreviewModal } from './components/WidgetPreviewModal';
import { LiveRemoteModal } from './components/LiveRemoteModal';
import { ExternalLink, RefreshCw } from 'lucide-react';

import { storage } from './services/storage';
import { antigravityClient } from './services/antigravityClient';
import { widgetBridge } from './services/widgetBridge';
import { HostConfig, Project, Session, Message, ToolCall } from './types';

export const App: React.FC = () => {
  // Application Data States
  const [hostConfig, setHostConfig] = useState<HostConfig | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  // UI Interactive States
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isWidgetPreviewOpen, setIsWidgetPreviewOpen] = useState<boolean>(false);
  const [isLiveRemoteOpen, setIsLiveRemoteOpen] = useState<boolean>(false);
  const [activeArtifact, setActiveArtifact] = useState<any | null>(null);
  const [isSyncingServer, setIsSyncingServer] = useState<boolean>(false);

  // 1. Initial Load from Persistent Storage & Server Brain
  const loadData = async () => {
    setIsSyncingServer(true);
    const cfg = await storage.getHostConfig();

    // Fetch real registered projects from server!
    let projs = await storage.fetchRealProjects();
    if (!projs || projs.length === 0) {
      projs = await storage.getProjects();
    }

    let activePId = await storage.getActiveProjectId();
    if (!projs.some((p) => p.id === activePId)) {
      activePId = projs[0]?.id || '641f4384-b46d-4f8d-8c4b-1fd3b7554682';
    }

    // Fetch real sessions filtered by project from server brain
    let sessList = await storage.fetchRealServerSessions(activePId);
    if (!sessList || sessList.length === 0) {
      sessList = await storage.getAllSessionsForProject(activePId);
    }

    setHostConfig(cfg);
    setProjects(projs);
    setActiveProjectId(activePId);
    setSessions(sessList);

    if (sessList.length > 0) {
      const activeSess = sessList[0];
      setActiveSessionId(activeSess.id);

      // Fetch real transcript messages from server brain
      const realMsgs = await storage.fetchRealTranscript(activeSess.id);
      setCurrentSession({
        ...activeSess,
        messages: realMsgs.length > 0 ? realMsgs : activeSess.messages || [],
      });
    }

    // Initialize remote client
    antigravityClient.connect(cfg);

    // Initialize widget data
    widgetBridge.updateWidgetData({
      hostName: cfg.name,
      isOnline: cfg.isConnected,
      activeProject: projs.find((p) => p.id === activePId)?.name || 'antigravity-app',
    });

    setIsSyncingServer(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate pending approvals count
  const pendingApprovalsCount =
    currentSession?.messages
      ?.flatMap((m) => m.toolCalls || [])
      ?.filter((t) => t.status === 'requires_approval').length || 0;

  // Sync pending approvals count with Widget whenever it changes
  useEffect(() => {
    widgetBridge.updateWidgetData({
      pendingApprovalsCount,
      currentTask:
        pendingApprovalsCount > 0
          ? `${pendingApprovalsCount} lệnh chờ duyệt`
          : 'Sẵn sàng nhận lệnh',
    });
  }, [pendingApprovalsCount]);

  // Real-time synchronization: Poll active session transcript every 2 seconds to reflect messages when chatting on Google Remote or desktop
  useEffect(() => {
    if (!activeSessionId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const realMsgs = await storage.fetchRealTranscript(activeSessionId);
        if (!isMounted) return;

        if (realMsgs && realMsgs.length > 0) {
          setCurrentSession((prev) => {
            if (!prev || prev.id !== activeSessionId) return prev;
            const prevLen = prev.messages?.length || 0;
            const newLen = realMsgs.length;
            if (prevLen !== newLen) {
              return { ...prev, messages: realMsgs };
            }
            // Check if latest message status, content or toolCalls changed
            if (prevLen > 0) {
              const lastPrev = prev.messages[prevLen - 1];
              const lastNew = realMsgs[newLen - 1];
              if (
                lastPrev &&
                lastNew &&
                (lastPrev.content !== lastNew.content ||
                  (lastPrev.toolCalls?.length || 0) !== (lastNew.toolCalls?.length || 0) ||
                  lastPrev.thinking !== lastNew.thinking)
              ) {
                return { ...prev, messages: realMsgs };
              }
            }
            return prev;
          });
        }
      } catch {}
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSessionId]);

  // Periodic check for new sessions created on Google Remote or PC host
  useEffect(() => {
    let isMounted = true;
    const sessionPollInterval = setInterval(async () => {
      try {
        const updatedSessions = await storage.fetchRealServerSessions(activeProjectId);
        if (!isMounted) return;
        if (updatedSessions && updatedSessions.length > 0) {
          setSessions((prev) => {
            if (prev.length !== updatedSessions.length || prev[0]?.id !== updatedSessions[0]?.id) {
              return updatedSessions;
            }
            return prev;
          });
        }
      } catch {}
    }, 8000);

    return () => {
      isMounted = false;
      clearInterval(sessionPollInterval);
    };
  }, [activeProjectId]);

  // Handle Switch Project (Filters conversations by project!)
  const handleSelectProject = async (projectId: string) => {
    setActiveProjectId(projectId);
    await storage.setActiveProjectId(projectId);
    const sessList = await storage.fetchRealServerSessions(projectId);
    setSessions(sessList);
    if (sessList.length > 0) {
      handleSelectSession(sessList[0].id);
    } else {
      handleNewSession();
    }
  };

  // Handle Switch Session
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);

    // 1. Fetch real messages from server brain
    const realMsgs = await storage.fetchRealTranscript(sessionId);
    const existing = sessions.find((s) => s.id === sessionId);

    if (existing) {
      setCurrentSession({
        ...existing,
        messages: realMsgs.length > 0 ? realMsgs : existing.messages || [],
      });
      return;
    }

    const sess = await storage.getSession(sessionId);
    if (sess) {
      setCurrentSession({
        ...sess,
        messages: realMsgs.length > 0 ? realMsgs : sess.messages || [],
      });
    }
  };

  // Handle New Session
  const handleNewSession = async () => {
    const newSess: Session = {
      id: 'sess_' + Date.now(),
      projectId: activeProjectId,
      title: 'Hội thoại mới',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    await storage.saveSession(newSess);
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setCurrentSession(newSess);
  };

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
    if (!currentSession) return;

    const userMsg: Message = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const assistantMsgPlaceholder: Message = {
      id: 'msg_asst_' + Date.now(),
      role: 'assistant',
      content: '',
      thinking: '',
      toolCalls: [],
      createdAt: new Date().toISOString(),
      status: 'streaming',
    };

    const updatedMessages = [...currentSession.messages, userMsg, assistantMsgPlaceholder];
    const updatedSess = {
      ...currentSession,
      title: currentSession.messages.length === 0 ? text.slice(0, 32) : currentSession.title,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setCurrentSession(updatedSess);
    setIsStreaming(true);

    // Call Antigravity Client with active project context
    const currentProj = projects.find((p) => p.id === activeProjectId) || projects[0];
    antigravityClient.sendMessage(
      text,
      activeProjectId,
      currentProj?.name || 'antigravity-app',
      (chunk) => {
        // on message chunk
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            last.content = chunk;
          }
          return { ...prev, messages: msgs };
        });
      },
      (thinkingChunk) => {
        // on thinking chunk
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            last.thinking = thinkingChunk;
          }
          return { ...prev, messages: msgs };
        });
      },
      (toolCall) => {
        // on tool call started or updated
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            const existingIdx = (last.toolCalls || []).findIndex((t) => t.id === toolCall.id);
            if (existingIdx >= 0) {
              last.toolCalls![existingIdx] = toolCall;
            } else {
              last.toolCalls = [...(last.toolCalls || []), toolCall];
            }
          }
          return { ...prev, messages: msgs };
        });
      },
      async (finalState) => {
        // on complete
        setIsStreaming(false);
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'assistant') {
            Object.assign(last, finalState);
          }
          const finalSess = { ...prev, messages: msgs };
          storage.saveSession(finalSess);
          return finalSess;
        });
      }
    );
  };

  // Handle Stop Generation
  const handleStop = () => {
    setIsStreaming(false);
  };

  // Handle Tool Approval
  const handleApproveTool = (toolId: string) => {
    antigravityClient.approveTool(
      toolId,
      (updatedTool: ToolCall) => {
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          for (const m of msgs) {
            if (m.toolCalls) {
              const idx = m.toolCalls.findIndex((t) => t.id === toolId);
              if (idx >= 0) {
                m.toolCalls[idx] = updatedTool;
                break;
              }
            }
          }
          return { ...prev, messages: msgs };
        });
      },
      (finishMsg: string) => {
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last) {
            last.content += `\n\n${finishMsg}`;
            last.status = 'done';
          }
          storage.saveSession({ ...prev, messages: msgs });
          return { ...prev, messages: msgs };
        });
      }
    );
  };

  // Handle Tool Rejection
  const handleRejectTool = (toolId: string, feedback: string) => {
    antigravityClient.rejectTool(
      toolId,
      feedback,
      (updatedTool: ToolCall) => {
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          for (const m of msgs) {
            if (m.toolCalls) {
              const idx = m.toolCalls.findIndex((t) => t.id === toolId);
              if (idx >= 0) {
                m.toolCalls[idx] = updatedTool;
                break;
              }
            }
          }
          return { ...prev, messages: msgs };
        });
      },
      (finishMsg: string) => {
        setCurrentSession((prev) => {
          if (!prev) return prev;
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          if (last) {
            last.content += `\n\n${finishMsg}`;
            last.status = 'done';
          }
          storage.saveSession({ ...prev, messages: msgs });
          return { ...prev, messages: msgs };
        });
      }
    );
  };

  // Handle Pair Success
  const handlePairSuccess = async (newConfig: HostConfig) => {
    setHostConfig(newConfig);
    await storage.saveHostConfig(newConfig);
    antigravityClient.connect(newConfig);
  };

  if (!hostConfig) return null;

  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f9fafb] text-[#111827] font-sans overflow-hidden safe-top safe-bottom">
      {/* Top Header */}
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenWidgetPreview={() => setIsWidgetPreviewOpen(true)}
        onOpenLiveRemote={() => setIsLiveRemoteOpen(true)}
        activeProject={currentProject}
        hostConfig={hostConfig}
      />

      {/* Remote Control Live Status Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-3.5 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-semibold text-blue-950 truncate">
            Remote Active: <span className="font-mono text-blue-700">3a713708-cef0-49ba-b842-af9504802f6a-v2</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadData()}
            title="Đồng bộ hội thoại thực tế từ server"
            className="p-1 hover:bg-blue-100 rounded-lg text-blue-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingServer ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsLiveRemoteOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
          >
            <span>Mở Remote Live</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Chat Canvas Area */}
      <ChatCanvas
        messages={currentSession?.messages || []}
        isStreaming={isStreaming}
        onApproveTool={handleApproveTool}
        onRejectTool={handleRejectTool}
        onOpenArtifact={(art) => setActiveArtifact(art)}
      />

      {/* Sticky Bottom Input Bar */}
      <InputArea
        onSendMessage={handleSendMessage}
        onStop={handleStop}
        isStreaming={isStreaming}
      />

      {/* Sidebar Drawer Menu (includes Mandatory UI Version Tag) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshData={loadData}
      />

      {/* QR Code Scanner & Manual Pairing Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onPairSuccess={handlePairSuccess}
      />

      {/* System Settings & Telemetry Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hostConfig={hostConfig}
        onUpdateHostConfig={async (cfg) => {
          setHostConfig(cfg);
          await storage.saveHostConfig(cfg);
        }}
        onReloadServerData={loadData}
      />

      {/* Artifact Document / Diagram Viewer Modal */}
      <ArtifactModal
        isOpen={!!activeArtifact}
        onClose={() => setActiveArtifact(null)}
        artifact={activeArtifact}
      />

      {/* iOS Home Screen Widget Simulator Modal */}
      <WidgetPreviewModal
        isOpen={isWidgetPreviewOpen}
        onClose={() => setIsWidgetPreviewOpen(false)}
        hostConfig={hostConfig}
        activeProject={currentProject}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      {/* Google Antigravity Remote Live Modal */}
      <LiveRemoteModal
        isOpen={isLiveRemoteOpen}
        onClose={() => setIsLiveRemoteOpen(false)}
        hostConfig={hostConfig}
        onUpdateRemoteLink={async (newLink) => {
          const updated = {
            ...hostConfig,
            remoteLink: newLink,
          };
          setHostConfig(updated);
          await storage.saveHostConfig(updated);
        }}
        onSyncRealSessions={async () => {
          await loadData();
        }}
      />
    </div>
  );
};
