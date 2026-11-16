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
    <div className="my-3.5 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-md select-none">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-amber-950">
            Yêu Cầu Phê Duyệt Thực Thi Lệnh
          </h4>
          <p className="text-xs text-amber-900 mt-1">
            Agent đề xuất thực thi tác vụ sau trên máy tính server:
          </p>

          <div className="mt-2.5 p-3 rounded-xl bg-white border border-amber-200 text-xs sm:text-[13px] font-mono text-gray-900 font-semibold select-text overflow-x-auto shadow-inner">
            {tool.args.CommandLine ? `$ ${tool.args.CommandLine}` : (tool.toolSummary || tool.name)}
          </div>

          {/* Feedback input if user chooses to reject with notes */}
          {showFeedbackInput && (
            <div className="mt-3">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập lý do từ chối hoặc chỉ dẫn thêm..."
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-600 shadow-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 mt-3.5">
            <button
              onClick={() => onApprove(tool.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition active:scale-[0.98]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Chấp thuận (Proceed)</span>
            </button>

            {!showFeedbackInput ? (
              <button
                onClick={() => setShowFeedbackInput(true)}
                className="flex items-center justify-center gap-1 py-2.5 px-3.5 bg-white hover:bg-gray-100 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold border border-gray-300 transition"
              >
                <X className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                <span>Từ chối...</span>
              </button>
            ) : (
              <button
                onClick={() => onReject(tool.id, feedback)}
                className="flex items-center justify-center gap-1 py-2.5 px-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow"
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
