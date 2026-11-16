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
    <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 select-text">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">Antigravity Remote Ready</h3>
          <p className="text-xs text-zinc-400 max-w-xs mt-1">
            Gửi yêu cầu hoặc gõ lệnh để bắt đầu điều khiển dự án trên máy tính server của bạn.
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
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              {/* Message Content Container */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#27272a] text-zinc-100 rounded-tr-sm shadow-sm'
                    : 'bg-[#18181b]/90 text-zinc-200 border border-zinc-800/80 rounded-tl-sm shadow-md'
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
                  <div className="space-y-1 mb-2.5">
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
                <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed">
                  {msg.content}
                  {isStreaming && isLastMessage && !msg.content && !msg.thinking && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse rounded-sm align-middle" />
                  )}
                </div>

                {/* Artifacts pills */}
                {!isUser && msg.artifacts && msg.artifacts.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800 flex flex-wrap gap-1.5">
                    {msg.artifacts.map((art) => (
                      <button
                        key={art.id}
                        onClick={() => onOpenArtifact(art)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 rounded-xl border border-blue-800/40 text-[11px] transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-medium truncate max-w-[180px]">{art.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Bottom Action Toolbar (Copy button) */}
                {!isUser && msg.content && (
                  <div className="mt-2.5 pt-1.5 flex items-center justify-end gap-2 text-zinc-500">
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="p-1 hover:text-zinc-300 transition rounded"
                      title="Sao chép nội dung"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-7 h-7 rounded-xl bg-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
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
