import React, { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { RemoteWorkspace } from '../types';

interface KeepAliveContainerProps {
  workspaces: RemoteWorkspace[];
  activeId: string;
  onOpenScanner: () => void;
}

export const KeepAliveContainer: React.FC<KeepAliveContainerProps> = ({
  workspaces,
  activeId,
  onOpenScanner,
}) => {
  const [iframeKeyMap, setIframeKeyMap] = useState<Record<string, number>>({});

  const handleReloadWorkspace = (id: string) => {
    setIframeKeyMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  if (workspaces.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f9fafb]">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa Có Dự Án Nào Được Kết Nối</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Quét mã QR từ phiên Google Antigravity Remote trên màn hình máy tính của bạn để bắt đầu điều khiển từ xa.
        </p>
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition"
        >
          <span>Quét Mã QR Kết Nối Ngay</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-black">
      {workspaces.map((ws) => {
        const isActive = ws.id === activeId;
        const reloadKey = iframeKeyMap[ws.id] || 0;

        return (
          <div
            key={ws.id}
            style={{ display: isActive ? 'block' : 'none' }}
            className="absolute inset-0 w-full h-full bg-white select-text"
          >
            {/* The Persistent Keep-Alive Webview Frame */}
            <iframe
              key={`${ws.id}_${reloadKey}`}
              src={ws.url}
              title={ws.name}
              allow="camera; microphone; clipboard-read; clipboard-write; display-capture; autoplay; full-screen"
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            />

            {/* In case browser blocks iframe security (X-Frame-Options fallback banner) */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              <button
                onClick={() => handleReloadWorkspace(ws.id)}
                title="Tải lại tab này"
                className="p-2 bg-white/90 hover:bg-white text-gray-700 hover:text-black rounded-xl shadow-md border border-gray-200 backdrop-blur-sm transition active:scale-90"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => window.open(ws.url, '_blank')}
                title="Mở toàn màn hình ngoài Safari"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white text-blue-600 rounded-xl shadow-md border border-gray-200 text-xs font-bold backdrop-blur-sm transition active:scale-90"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mở Ngoài</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
