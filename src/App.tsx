import React, { useState, useEffect } from 'react';
import { KeepAliveContainer } from './components/KeepAliveContainer';
import { FloatingDock } from './components/FloatingDock';
import { CameraQRScanner } from './components/CameraQRScanner';
import { ManageWorkspacesModal } from './components/ManageWorkspacesModal';
import { SettingsModal } from './components/SettingsModal';
import { RemoteWorkspace } from './types';
import { workspaceStore } from './services/workspaceStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const App: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<RemoteWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved workspaces and settings on app start
  useEffect(() => {
    const initApp = async () => {
      try {
        const loadedWorkspaces = await workspaceStore.getWorkspaces();
        const activeId = await workspaceStore.getActiveWorkspaceId();
        const settings = await workspaceStore.getSettings();

        setWorkspaces(loadedWorkspaces);
        setActiveWorkspaceId(
          loadedWorkspaces.some((w) => w.id === activeId)
            ? activeId
            : loadedWorkspaces[0]?.id || ''
        );

        if (settings.autoFullscreen) {
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error('Failed to initialize workspaces:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Workspace actions
  const handleSelectWorkspace = async (id: string) => {
    setActiveWorkspaceId(id);
    await workspaceStore.setActiveWorkspaceId(id);
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {}
  };

  const handleWorkspaceAdded = async (url: string, name?: string) => {
    const added = await workspaceStore.addWorkspace(url, name);
    const updated = await workspaceStore.getWorkspaces();
    setWorkspaces(updated);
    setActiveWorkspaceId(added.id);
  };

  const handleRemoveWorkspace = async (id: string) => {
    const updated = await workspaceStore.removeWorkspace(id);
    setWorkspaces(updated);
    const activeId = await workspaceStore.getActiveWorkspaceId();
    setActiveWorkspaceId(activeId);
  };

  const handleUpdateWorkspace = async (ws: RemoteWorkspace) => {
    await workspaceStore.updateWorkspace(ws);
    const updated = await workspaceStore.getWorkspaces();
    setWorkspaces(updated);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-gray-300">
            Đang khởi động Google Antigravity Remote...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-black select-none">
      {/* Zero-Reload Keep-Alive Multi-Project Frame Engine */}
      <KeepAliveContainer
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Floating Glassmorphism Tab Switcher Dock */}
      {workspaces.length > 0 && (
        <FloatingDock
          workspaces={workspaces}
          activeId={activeWorkspaceId}
          onSelectWorkspace={handleSelectWorkspace}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenManageWorkspaces={() => setIsManageOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCloseWorkspace={handleRemoveWorkspace}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />
      )}

      {/* Camera QR Scanner & Link Importer Modal */}
      <CameraQRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onWorkspaceAdded={handleWorkspaceAdded}
      />

      {/* Workspace Manager Modal */}
      <ManageWorkspacesModal
        isOpen={isManageOpen}
        onClose={() => setIsManageOpen(false)}
        workspaces={workspaces}
        activeId={activeWorkspaceId}
        onSelectWorkspace={(id) => {
          handleSelectWorkspace(id);
          setIsManageOpen(false);
        }}
        onRemoveWorkspace={handleRemoveWorkspace}
        onUpdateWorkspace={handleUpdateWorkspace}
        onOpenScanner={() => {
          setIsManageOpen(false);
          setIsScannerOpen(true);
        }}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
export default App;
