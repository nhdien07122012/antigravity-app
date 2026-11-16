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
    <div className="mb-3.5 overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/60 shadow-sm transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-amber-100/50 transition"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
          <Brain className={`w-4 h-4 ${isStreaming ? 'text-amber-600 animate-pulse' : 'text-amber-700'}`} />
          <span>Quá trình suy nghĩ (Thinking Process)</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-medium">
              <Sparkles className="w-3 h-3 animate-spin text-amber-600" />
              Đang phân tích...
            </span>
          )}
        </div>
        <div className="text-amber-700">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 pb-3 pt-1 text-xs sm:text-[13px] text-amber-950 border-t border-amber-200/80 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto bg-amber-50/30">
          {thinking}
        </div>
      )}
    </div>
  );
};
