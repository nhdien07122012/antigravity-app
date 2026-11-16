import React from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-xl h-[85vh] sm:h-[80vh] bg-white border border-gray-200 rounded-t-3xl sm:rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{artifact.title}</h3>
              <p className="text-xs text-gray-500 truncate">{artifact.path}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-200 transition"
              title="Sao chép nội dung"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-black rounded-lg hover:bg-gray-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary note */}
        {artifact.summary && (
          <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 text-xs sm:text-sm text-blue-900 font-medium">
            {artifact.summary}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 select-text bg-[#fcfcfc]">
          <pre className="text-xs sm:text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
            {artifact.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
