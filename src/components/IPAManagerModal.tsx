import React, { useState, useEffect } from 'react';
import { Download, Share2, ExternalLink, X, CheckCircle2, Sparkles, RefreshCw, Copy, Compass } from 'lucide-react';
import { FULL_VERSION } from '../version';

interface IPAManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReleaseInfo {
  tagName: string;
  name: string;
  assetName: string;
  assetSize: string;
  publishedAt: string;
  downloadUrl: string;
}

export const IPAManagerModal: React.FC<IPAManagerModalProps> = ({ isOpen, onClose }) => {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const directIpaUrl = 'https://github.com/nhdien07122012/antigravity-app/releases/download/latest/AntigravityMobile.ipa';
  const releasePageUrl = 'https://github.com/nhdien07122012/antigravity-app/releases/tag/latest';

  useEffect(() => {
    if (!isOpen) return;

    const fetchRelease = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://api.github.com/repos/nhdien07122012/antigravity-app/releases/tags/latest');
        if (res.ok) {
          const data = await res.json();
          const ipaAsset = data.assets?.find((a: any) => a.name?.endsWith('.ipa')) || data.assets?.[0];
          const sizeMb = ipaAsset ? (ipaAsset.size / 1024 / 1024).toFixed(2) + ' MB' : '1.40 MB';
          setRelease({
            tagName: data.tag_name || 'latest',
            name: data.name || 'Antigravity Mobile IPA',
            assetName: ipaAsset?.name || 'AntigravityMobile.ipa',
            assetSize: sizeMb,
            publishedAt: ipaAsset?.updated_at ? new Date(ipaAsset.updated_at).toLocaleDateString('vi-VN') : 'Mới cập nhật',
            downloadUrl: ipaAsset?.browser_download_url || directIpaUrl,
          });
        }
      } catch (err) {
        console.error('Failed to fetch release info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelease();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // If running inside iOS Native app with WebKit handler
    if ((window as any).webkit?.messageHandlers?.antigravityNative) {
      (window as any).webkit.messageHandlers.antigravityNative.postMessage({ action: 'openIpaManager' });
      onClose();
      return;
    }

    // In external browser: open direct download URL
    const url = release?.downloadUrl || directIpaUrl;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    const url = release?.downloadUrl || directIpaUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('Đã sao chép link tải IPA trực tiếp vào bộ nhớ tạm!');
      setTimeout(() => setCopyStatus(null), 3000);
    } catch {
      setCopyStatus('Không thể sao chép tự động: ' + url);
      setTimeout(() => setCopyStatus(null), 5000);
    }
  };

  const handleShare = async () => {
    const url = release?.downloadUrl || directIpaUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Antigravity Mobile IPA',
          text: 'Tải file AntigravityMobile.ipa để Sideload qua TrollStore, SideStore hoặc AltStore:',
          url: url,
        });
        return;
      } catch {}
    }
    handleCopyLink();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#141419] rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Quản Lý Bản Cài IPA
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tải về & Chia sẻ Sideload iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Version Info Card */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span>BẢN DỰNG ỨNG DỤNG</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                {FULL_VERSION}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kiểm tra GitHub Releases...</span>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {release?.name || 'Antigravity Mobile IPA (Direct Download)'}
                  </div>
                  <div>• Tệp: <span className="font-mono font-medium">{release?.assetName || 'AntigravityMobile.ipa'}</span></div>
                  <div>• Dung lượng: <span className="font-semibold text-blue-600 dark:text-blue-400">{release?.assetSize || '1.40 MB'}</span></div>
                  <div>• Cập nhật: {release?.publishedAt || 'Hôm nay'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Sideload Guides Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <span className="font-bold">Hỗ trợ mọi công cụ Sideload:</span> Tương thích hoàn toàn với <strong>TrollStore</strong>, <strong>SideStore</strong>, <strong>AltStore</strong>, hoặc lưu trực tiếp vào <strong>Tệp (Files)</strong>.
            </div>
          </div>

          {copyStatus && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{copyStatus}</span>
            </div>
          )}

          {/* Primary Action: Direct Download IPA with safe interception */}
          <button
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Tải Bản Cài IPA Về Máy ({release?.assetSize || '1.40 MB'})</span>
          </button>

          {/* Secondary Action: Share File / Sideload */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Chia Sẻ Để Sideload (TrollStore / SideStore)</span>
          </button>

          {/* Third Action: Open via Safari */}
          <a
            href={release?.downloadUrl || directIpaUrl}
            target="_system"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-900/50 text-sky-700 dark:text-sky-300 rounded-2xl font-semibold text-xs active:scale-95 transition"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mở Tải Qua Trình Duyệt Safari</span>
          </a>

          {/* Copy Direct Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-200 rounded-2xl font-medium text-xs transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Sao Chép Link Tải IPA Trực Tiếp</span>
          </button>

          {/* View on GitHub */}
          <a
            href={releasePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Xem Chi Tiết Bản Phát Hành Trên GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};
