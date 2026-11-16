import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatCanvas } from './components/ChatCanvas';
import { InputArea } from './components/InputArea';
import { QRScannerModal } from './components/QRScannerModal';
import { SettingsModal } from './components/SettingsModal';
import { ArtifactModal } from './components/ArtifactModal';
import { WidgetPreviewModal } from './components/WidgetPreviewModal';

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
  const [activeArtifact, setActiveArtifact] = useState<any | null>(null);

  // 1. Initial Load from Persistent Storage
  useEffect(() => {
    async function loadData() {
      const cfg = await storage.getHostConfig();
      const projs = await storage.getProjects();
      const activePId = await storage.getActiveProjectId();
      const sessList = await storage.getAllSessionsForProject(activePId);

      setHostConfig(cfg);
      setProjects(projs);
      setActiveProjectId(activePId);
      setSessions(sessList);

      if (sessList.length > 0) {
        setActiveSessionId(sessList[0].id);
        setCurrentSession(sessList[0]);
      }

      // Initialize remote client
      antigravityClient.connect(cfg);

      // Initialize widget data
      widgetBridge.updateWidgetData({
        hostName: cfg.name,
        isOnline: cfg.isConnected,
        activeProject: projs.find((p) => p.id === activePId)?.name || 'antigravity-app',
      });
    }

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
      currentTask: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} lệnh chờ duyệt` : 'Sẵn sàng nhận lệnh',
    });
  }, [pendingApprovalsCount]);

  // Handle Switch Project
  const handleSelectProject = async (projectId: string) => {
    setActiveProjectId(projectId);
    await storage.setActiveProjectId(projectId);
    const sessList = await storage.getAllSessionsForProject(projectId);
    setSessions(sessList);
    if (sessList.length > 0) {
      setActiveSessionId(sessList[0].id);
      setCurrentSession(sessList[0]);
    } else {
      handleNewSession();
    }
  };

  // Handle Switch Session
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    const sess = await storage.getSession(sessionId);
    if (sess) {
      setCurrentSession(sess);
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

    // Call Antigravity Client
    antigravityClient.sendMessage(
      text,
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
        activeProject={currentProject}
        hostConfig={hostConfig}
      />

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
    </div>
  );
};
