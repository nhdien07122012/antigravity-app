import React, { useState } from 'react';
import { X, Trash2, Edit2, Check, ExternalLink, Globe, Layers, Plus } from 'lucide-react';
import { RemoteWorkspace } from '../types';

interface ManageWorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: RemoteWorkspace[];
  activeId: string;
  onSelectWorkspace: (id: string) => void;
  onRemoveWorkspace: (id: string) => void;
  onUpdateWorkspace: (ws: RemoteWorkspace) => void;
  onOpenScanner: () => void;
}

export const ManageWorkspacesModal: React.FC<ManageWorkspacesModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  activeId,
  onSelectWorkspace,
  onRemoveWorkspace,
  onUpdateWorkspace,
  onOpenScanner,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const startEdit = (ws: RemoteWorkspace) => {
    setEditingId(ws.id);
    setEditName(ws.name);
  };

  const saveEdit = (ws: RemoteWorkspace) => {
    if (editName.trim()) {
      onUpdateWorkspace({ ...ws, name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[90vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Quản Lý Dự Án</h3>
              <p className="text-xs text-gray-500">
                {workspaces.length} dự án đang mở song song trong bộ nhớ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {workspaces.map((ws) => {
            const isActive = ws.id === activeId;
            const isEditing = editingId === ws.id;

            return (
              <div
                key={ws.id}
                className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs font-bold border border-blue-500 rounded-lg focus:outline-none bg-white"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(ws)}
                        className="p-1 text-emerald-600 hover:text-emerald-800"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        onSelectWorkspace(ws.id);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ws.iconColor || '#2563eb' }}
                        />
                        <span className="font-bold text-sm text-gray-900 truncate">{ws.name}</span>
                        {isActive && (
                          <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                            Đang xem
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                        {ws.sessionId ? `Session: ${ws.sessionId}` : ws.url}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(ws)}
                    title="Đổi tên"
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => window.open(ws.url, '_blank')}
                    title="Mở ngoài"
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {workspaces.length > 1 && (
                    <button
                      onClick={() => onRemoveWorkspace(ws.id)}
                      title="Xóa dự án này"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenScanner();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Quét Mã Dự Án Mới</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
};
