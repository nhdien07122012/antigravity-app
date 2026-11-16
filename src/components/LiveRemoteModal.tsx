import React, { useState } from 'react';
import { X, ExternalLink, Globe, CheckCircle2, Copy, Check, RefreshCw, Key, ShieldCheck } from 'lucide-react';
import { HostConfig } from '../types';

interface LiveRemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostConfig: HostConfig;
  onUpdateRemoteLink: (link: string) => void;
  onSyncRealSessions: () => void;
}

export const LiveRemoteModal: React.FC<LiveRemoteModalProps> = ({
  isOpen,
  onClose,
  hostConfig,
  onUpdateRemoteLink,
  onSyncRealSessions,
}) => {
  const [remoteUrl, setRemoteUrl] = useState(
    hostConfig.remoteLink ||
      'https://accounts.google.com/AccountChooser?Email=dien07122012%40gmail.com&continue=https%3A%2F%2Fantigravity.google.com%2Fr%2F3a713708-cef0-49ba-b842-af9504802f6a-v2'
  );
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(remoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenRemoteWindow = () => {
    window.open(remoteUrl, '_blank');
  };

  const handleSaveAndSync = () => {
    onUpdateRemoteLink(remoteUrl);
    onSyncRealSessions();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Globe className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Google Antigravity Remote Control</h3>
              <p className="text-xs text-gray-500">Kết nối phiên làm việc chính thức từ xa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status Alert Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-950 leading-relaxed font-medium">
              Đây là liên kết Remote Control được sinh ra từ máy chủ Antigravity của bạn. Đăng nhập đúng tài khoản <b>dien07122012@gmail.com</b> để kích hoạt điều khiển 100% thời gian thực.
            </div>
          </div>

          {/* Remote Session Info Card */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Tài khoản Google:</span>
              <span className="font-bold text-gray-900 font-mono">dien07122012@gmail.com</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Remote Session ID:</span>
              <span className="font-bold text-blue-700 font-mono bg-blue-100/60 px-2 py-0.5 rounded-lg border border-blue-200">
                3a713708-cef0-49ba-b842-af9504802f6a-v2
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Trạng thái máy chủ:</span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đang trực tuyến (Dell PC Server)
              </span>
            </div>
          </div>

          {/* Primary Action Button: Open Google Remote Directly */}
          <button
            onClick={handleOpenRemoteWindow}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md active:scale-[0.99] transition"
          >
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            <span>Mở Trực Tiếp Phiên Remote Google (1 Chạm)</span>
          </button>

          {/* Link Configuration Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase">Liên kết Remote / QR Code Link:</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
              </button>
            </div>
            <textarea
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500 font-medium resize-none shadow-inner"
            />
          </div>

          {/* Sync Local Real Brain Button */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={handleSaveAndSync}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl text-xs sm:text-sm font-bold border border-gray-300 transition"
            >
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isSaved ? 'animate-spin' : ''}`} />
              <span>{isSaved ? 'Đã lưu & Đang đồng bộ...' : 'Đồng Bộ 17 Phiên Chat Thật Từ Server Ngay'}</span>
            </button>
            <p className="text-[11px] text-gray-500 text-center mt-1.5">
              Tải toàn bộ hội thoại, mã nguồn và log thực tế từ thư mục <code>brain/</code> trên máy tính.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
