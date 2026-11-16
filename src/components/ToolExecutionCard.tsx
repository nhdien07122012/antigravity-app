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
        return <Terminal className="w-4 h-4 text-emerald-600" />;
      case 'write_file':
      case 'edit_file':
        return <FileCode className="w-4 h-4 text-blue-600" />;
      case 'search_web':
        return <Search className="w-4 h-4 text-purple-600" />;
      default:
        return <Terminal className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (tool.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Đang chạy
          </span>
        );
      case 'done':
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Hoàn tất
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            Lỗi
          </span>
        );
      case 'requires_approval':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-bold">
            Chờ bạn duyệt
          </span>
        );
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {getToolIcon()}
          <span className="text-sm font-mono font-semibold text-gray-900 truncate">
            {tool.toolSummary || tool.name}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
          <div className="text-gray-400">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Details / Terminal Output / Code Diff */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-3.5 text-xs sm:text-[13px] font-mono">
          {/* Command or Path Details */}
          {tool.args.CommandLine && (
            <div className="mb-2.5 pb-2.5 border-b border-gray-200">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Lệnh thực thi:</span>
              <div className="text-gray-900 bg-white p-2.5 rounded-xl mt-1.5 border border-gray-200 select-text font-semibold shadow-inner overflow-x-auto">
                $ {tool.args.CommandLine}
              </div>
            </div>
          )}

          {tool.args.Path && (
            <div className="mb-2.5 pb-2.5 border-b border-gray-200">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Đường dẫn file:</span>
              <div className="text-blue-700 bg-white p-2 rounded-xl mt-1.5 border border-gray-200 select-text truncate">
                {tool.args.Path}
              </div>
            </div>
          )}

          {/* Code Diff Display if available */}
          {tool.diff && (
            <div className="mb-2.5">
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Thay đổi code (Diff):</span>
              <div className="mt-1.5 bg-white p-2.5 rounded-xl border border-gray-200 text-xs leading-relaxed overflow-x-auto shadow-inner">
                {tool.diff.target && (
                  <div className="text-rose-700 bg-rose-50 px-2 py-1 rounded font-medium">
                    - {tool.diff.target}
                  </div>
                )}
                {tool.diff.replacement && (
                  <div className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 font-medium">
                    + {tool.diff.replacement}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Output */}
          {tool.output && (
            <div>
              <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">Kết quả đầu ra:</span>
              <pre className="mt-1.5 bg-white p-3 rounded-xl border border-gray-200 text-gray-800 text-xs leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto select-text shadow-inner">
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
