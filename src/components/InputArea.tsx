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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
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
      setTimeout(() => {
        setText((prev) => (prev ? prev + ' ' : '') + 'Kiểm tra trạng thái dự án hiện tại trên server');
        setIsRecording(false);
      }, 2000);
    }
  };

  return (
    <div className="relative p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-sm select-none">
      {/* Slash Commands Auto-suggest Popup */}
      {showCommands && (
        <div className="absolute bottom-full left-3 right-3 mb-2.5 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-40 max-h-64 overflow-y-auto">
          <div className="px-3.5 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Lệnh Antigravity Slash Commands</span>
          </div>
          {AVAILABLE_COMMANDS.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => handleSelectCommand(cmd)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
            >
              <div className="min-w-0">
                <span className="text-sm font-mono font-bold text-blue-600">{cmd.command}</span>
                <span className="text-sm text-gray-900 ml-2 font-semibold">{cmd.label}</span>
                <p className="text-xs text-gray-500 truncate mt-0.5">{cmd.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Attachment Options Menu */}
      {showAttachMenu && (
        <div className="absolute bottom-full left-3 mb-2.5 bg-white border border-gray-200 rounded-2xl p-2 shadow-xl flex flex-col gap-1 z-40 min-w-[190px]">
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm ảnh chụp camera]');
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-xl transition"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span>Chụp ảnh mới</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm ảnh từ thư viện]');
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-xl transition"
          >
            <Image className="w-4 h-4 text-blue-600" />
            <span>Thư viện ảnh</span>
          </button>
          <button
            onClick={() => {
              setShowAttachMenu(false);
              setText((prev) => (prev ? prev + ' ' : '') + '[Đính kèm tài liệu]');
            }}
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 rounded-xl transition"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Chọn tài liệu</span>
          </button>
        </div>
      )}

      {/* Main Input Box (Font size text-base / 16px prevents iOS Safari auto-zoom!) */}
      <div className="flex items-end gap-2 bg-[#f4f4f5] border border-gray-300 rounded-3xl px-3 py-2 focus-within:border-gray-500 focus-within:bg-white transition shadow-sm">
        {/* Attachment Button */}
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          className="p-1.5 text-gray-600 hover:text-black rounded-full hover:bg-gray-200 active:scale-95 transition shrink-0 mb-0.5"
          title="Đính kèm tệp / ảnh"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhắn tin cho Antigravity (gõ / để mở lệnh)..."
          rows={1}
          className="flex-1 max-h-32 bg-transparent text-base text-gray-900 placeholder-gray-500 resize-none focus:outline-none py-1.5 px-1 leading-normal"
        />

        {/* Voice Dictation Button */}
        <button
          onClick={toggleRecording}
          className={`p-1.5 rounded-full transition shrink-0 mb-0.5 ${
            isRecording
              ? 'bg-rose-100 text-rose-600 animate-pulse'
              : 'text-gray-600 hover:text-black hover:bg-gray-200'
          }`}
          title="Nhập giọng nói"
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send / Stop Button (ChatGPT-style circular button) */}
        <button
          onClick={handleSend}
          disabled={!isStreaming && !text.trim()}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition active:scale-90 ${
            isStreaming
              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'
              : text.trim()
              ? 'bg-black text-white hover:bg-gray-800 shadow-md'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={isStreaming ? 'Dừng tác vụ' : 'Gửi'}
        >
          {isStreaming ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <ArrowUp className="w-5 h-5 stroke-[2.6]" />
          )}
        </button>
      </div>
    </div>
  );
};
