import React, { useState } from 'react';
import { Terminal, FileCode, Search, CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ToolCall } from '../types';

interface ToolExecutionCardProps {
  tool: ToolCall;
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = () => {
    switch (tool.name) {
      case 'run_command':
        return <Terminal className="w-3.5 h-3.5 text-emerald-400" />;
      case 'write_file':
      case 'edit_file':
        return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
      case 'search_web':
        return <Search className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = () => {
    switch (tool.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
            <Clock className="w-3 h-3 animate-spin" />
            Đang chạy
          </span>
        );
      case 'done':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Xong
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-medium">
            <AlertCircle className="w-3 h-3" />
            Lỗi
          </span>
        );
      case 'requires_approval':
        return (
          <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-medium bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/30">
            Chờ duyệt
          </span>
        );
    }
  };

  return (
    <div className="my-2.5 rounded-xl border border-zinc-800 bg-[#121215] overflow-hidden shadow-sm">
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/40 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          {getToolIcon()}
          <span className="text-xs font-mono font-medium text-zinc-200 truncate">
            {tool.toolSummary || tool.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
          <div className="text-zinc-500">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {/* Expanded Details / Terminal Output / Code Diff */}
      {isExpanded && (
        <div className="border-t border-zinc-800/70 bg-[#09090b] p-3 text-xs font-mono">
          {/* Command or Path Details */}
          {tool.args.CommandLine && (
            <div className="mb-2 pb-2 border-b border-zinc-800/60">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Lệnh thực thi:</span>
              <div className="text-emerald-400 bg-zinc-950 p-2 rounded-lg mt-1 border border-zinc-900 select-text overflow-x-auto">
                $ {tool.args.CommandLine}
              </div>
            </div>
          )}

          {tool.args.Path && (
            <div className="mb-2 pb-2 border-b border-zinc-800/60">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Đường dẫn file:</span>
              <div className="text-blue-300 bg-zinc-950 p-1.5 rounded-lg mt-1 border border-zinc-900 select-text truncate">
                {tool.args.Path}
              </div>
            </div>
          )}

          {/* Code Diff Display if available */}
          {tool.diff && (
            <div className="mb-2">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Thay đổi (Diff):</span>
              <div className="mt-1 bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-[11px] leading-relaxed overflow-x-auto">
                {tool.diff.target && (
                  <div className="text-rose-400 bg-rose-950/20 px-1 py-0.5 rounded">
                    - {tool.diff.target}
                  </div>
                )}
                {tool.diff.replacement && (
                  <div className="text-emerald-400 bg-emerald-950/20 px-1 py-0.5 rounded mt-0.5">
                    + {tool.diff.replacement}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Output */}
          {tool.output && (
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Kết quả đầu ra:</span>
              <pre className="mt-1 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900 text-zinc-300 text-[11px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-text">
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
