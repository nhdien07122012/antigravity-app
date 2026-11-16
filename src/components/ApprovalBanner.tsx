import React, { useState } from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { ToolCall } from '../types';

interface ApprovalBannerProps {
  tool: ToolCall;
  onApprove: (toolId: string) => void;
  onReject: (toolId: string, feedback: string) => void;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({
  tool,
  onApprove,
  onReject,
}) => {
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  return (
    <div className="my-3 p-3.5 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-amber-950/20 shadow-lg select-none">
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-amber-200">
            Yêu cầu phê duyệt thực thi lệnh
          </h4>
          <p className="text-[11px] text-zinc-300 mt-0.5">
            Agent muốn thực thi tác vụ trên máy chủ:
          </p>

          <div className="mt-2 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono text-emerald-400 select-text overflow-x-auto">
            {tool.args.CommandLine ? `$ ${tool.args.CommandLine}` : (tool.toolSummary || tool.name)}
          </div>

          {/* Feedback input if user chooses to reject with notes */}
          {showFeedbackInput && (
            <div className="mt-2.5">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập lý do từ chối hoặc chỉ dẫn thêm..."
                className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => onApprove(tool.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>Chấp thuận (Proceed)</span>
            </button>

            {!showFeedbackInput ? (
              <button
                onClick={() => setShowFeedbackInput(true)}
                className="flex items-center justify-center gap-1 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700 transition"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Từ chối...</span>
              </button>
            ) : (
              <button
                onClick={() => onReject(tool.id, feedback)}
                className="flex items-center justify-center gap-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition"
              >
                <span>Xác nhận Hủy</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
