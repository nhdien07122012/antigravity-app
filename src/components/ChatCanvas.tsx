import React, { useRef, useEffect } from 'react';
import { Copy, Check, Sparkles, FileText, Bot, User } from 'lucide-react';
import { Message, ToolCall } from '../types';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolExecutionCard } from './ToolExecutionCard';
import { ApprovalBanner } from './ApprovalBanner';

interface ChatCanvasProps {
  messages: Message[];
  isStreaming: boolean;
  onApproveTool: (toolId: string) => void;
  onRejectTool: (toolId: string, feedback: string) => void;
  onOpenArtifact: (artifact: any) => void;
}

export const ChatCanvas: React.FC<ChatCanvasProps> = ({
  messages,
  isStreaming,
  onApproveTool,
  onRejectTool,
  onOpenArtifact,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Auto-scroll on new message or streaming chunk
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 select-text bg-[#f9fafb]">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-blue-600 mb-3.5">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Antigravity Remote Đã Sẵn Sàng</h3>
          <p className="text-sm text-gray-600 max-w-xs mt-1 leading-relaxed">
            Nhắn tin hoặc gõ lệnh để bắt đầu điều khiển dự án trên máy tính server của bạn.
          </p>
        </div>
      ) : (
        messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastMessage = idx === messages.length - 1;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 stroke-[2.2]" />
                </div>
              )}

              {/* Message Content Container */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed ${
                  isUser
                    ? 'bg-zinc-900 text-white rounded-tr-sm shadow-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm shadow-sm'
                }`}
              >
                {/* Thinking Accordion (for Assistant) */}
                {!isUser && msg.thinking && (
                  <ThinkingBlock
                    thinking={msg.thinking}
                    isStreaming={isStreaming && isLastMessage && !msg.content}
                  />
                )}

                {/* Tool Executions Cards */}
                {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {msg.toolCalls.map((tool) => (
                      <React.Fragment key={tool.id}>
                        <ToolExecutionCard tool={tool} />
                        {tool.status === 'requires_approval' && (
                          <ApprovalBanner
                            tool={tool}
                            onApprove={onApproveTool}
                            onReject={onRejectTool}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* Main Text Content */}
                <div className="whitespace-pre-wrap font-sans text-[15px] leading-7 select-text">
                  {msg.content}
                  {isStreaming && isLastMessage && !msg.content && !msg.thinking && (
                    <span className="inline-block w-2.5 h-4 ml-1 bg-blue-600 animate-pulse rounded-sm align-middle" />
                  )}
                </div>

                {/* Artifacts pills */}
                {!isUser && msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {msg.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => onOpenArtifact(art)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 text-xs sm:text-sm font-semibold transition shadow-sm"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="truncate max-w-[200px]">{art.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Toolbar (Copy button) */}
                {!isUser && msg.content && (
                  <div className="mt-3 pt-2 flex items-center justify-end gap-2 text-gray-400 border-t border-gray-50">
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="p-1.5 hover:text-gray-700 hover:bg-gray-100 transition rounded-lg"
                      title="Sao chép nội dung"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-700 shrink-0 mt-0.5 shadow-sm">
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
              )}
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
};
