import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

interface ThinkingBlockProps {
  thinking: string;
  isStreaming?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ thinking, isStreaming }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/40 transition"
      >
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <Brain className={`w-3.5 h-3.5 ${isStreaming ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`} />
          <span>Quá trình suy nghĩ (Thinking)</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded-full border border-amber-400/30">
              <Sparkles className="w-2.5 h-2.5 animate-spin" />
              Đang phân tích...
            </span>
          )}
        </div>
        <div className="text-zinc-500">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 text-xs text-zinc-400 border-t border-zinc-800/60 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  );
};
