import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Plus, Mic, Sparkles, Image, FileText, Camera } from 'lucide-react';
import { SlashCommand } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
}

const AVAILABLE_COMMANDS: SlashCommand[] = [
  { command: '/goal', label: 'Mục tiêu chạy đêm', description: 'Chạy tác vụ dài hạn không dừng cho đến khi hoàn tất' },
  { command: '/plan', label: 'Lập kế hoạch', description: 'Lên kế hoạch chi tiết từng bước trước khi viết code' },
  { command: '/compact', label: 'Tối ưu ngữ cảnh', description: 'Tóm tắt bớt ngữ cảnh để giải phóng bộ nhớ context' },
  { command: '/schedule', label: 'Lên lịch tác vụ', description: 'Cài đặt hẹn giờ chạy định kỳ hoặc chạy 1 lần' },
  { command: '/browser', label: 'Mở trình duyệt', description: 'Tự động duyệt web, điền form hoặc kiểm thử UI' },
  { command: '/teamwork', label: 'Nhóm Agent', description: 'Điều phối nhiều subagents làm việc song song' },
  { command: '/boost', label: 'Tư duy nâng cao', description: 'Kích hoạt suy nghĩ sâu cho bài toán phức tạp' },
];

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
}) => {
  const [text, setText] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Show slash commands when text starts with / or has / after a space
    if (val.startsWith('/') || val.includes(' /')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const handleSelectCommand = (cmd: SlashCommand) => {
    setText(cmd.command + ' ');
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      onStop();
      return;
    }

    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate audio dictation transcript
      setTimeout(() => {
        setText((prev) => (prev ? prev + ' ' : '') + 'Kiểm tra trạng thái dự án hiện tại trên server');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="relative p-2.5 bg-[#09090b]/95 backdrop-blur-md border-t border-[#27272a] select-none">
      {/* Slash Commands Auto-suggest Popup */}
      {showCommands && (
        <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-40 max-h-56 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider bg-[#0c0c0e] border-b border-zinc-800 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>Lệnh Antigravity Slash Commands</span>
          </div>
          {AVAILABLE_COMMANDS.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => handleSelectCommand(cmd)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/60 border-b border-zinc-800/40 last:border-b-0 transition"
            >
              <div className="min-w-0">
                <span className="text-xs font-mono font-semibold text-blue-400">{cmd.command}</span>
                <span className="text-xs text-zinc-200 ml-2 font-medium">{cmd.label}</span>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{cmd.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Options Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-3 mb-2 bg-[#121215] border border-zinc-800 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-40 min-w-[170px]">
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm ảnh chụp màn hình]');
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Chụp ảnh mới</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm ảnh từ thư viện]');
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <Image className="w-4 h-4 text-blue-400" />
            <span>Thư viện ảnh</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm file log/tài liệu]');
            }}
            className="flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Chọn tài liệu</span>
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className="flex items-end gap-1.5 bg-[#18181b] border border-zinc-800 rounded-3xl px-2.5 py-1.5 focus-within:border-zinc-700 transition">
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 active:scale-95 transition shrink-0 mb-0.5"
          title="Đính kèm tệp / ảnh"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhắn tin cho Antigravity (gõ / để mở lệnh)..."
          rows={1}
          className="flex-1 max-h-28 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none py-1.5 px-1 leading-relaxed"
        />

        {/* Voice Dictation Button */}
        <button
          onClick={toggleRecording}
          className={`p-1.5 rounded-full transition shrink-0 mb-0.5 ${
            isRecording
              ? 'bg-rose-500/20 text-rose-400 animate-pulse'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Nhập giọng nói"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send / Stop Button (ChatGPT-style circular button) */}
        <button
          onClick={handleSend}
          disabled={!isStreaming && !text.trim()}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition active:scale-90 ${
            isStreaming
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : text.trim()
              ? 'bg-white text-black hover:bg-zinc-200 shadow-md'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
          title={isStreaming ? 'Dừng tác vụ' : 'Gửi'}
        >
          {isStreaming ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  );
};
