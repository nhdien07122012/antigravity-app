import React from 'react';
import { X, FileText, Download, Copy, Check } from 'lucide-react';

interface ArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: {
    title: string;
    summary: string;
    content: string;
    path: string;
  } | null;
}

export const ArtifactModal: React.FC<ArtifactModalProps> = ({
  isOpen,
  onClose,
  artifact,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl h-[85vh] sm:h-[80vh] bg-[#121215] border border-zinc-800 rounded-t-3xl sm:rounded-2xl flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0e0e11]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">{artifact.title}</h3>
              <p className="text-[11px] text-zinc-400 truncate">{artifact.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary note */}
        {artifact.summary && (
          <div className="px-4 py-2 bg-blue-950/20 border-b border-blue-900/30 text-xs text-blue-300">
            {artifact.summary}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 select-text">
          <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {artifact.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
