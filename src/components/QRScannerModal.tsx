import React, { useState, useEffect } from 'react';
import { X, Camera, Link2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { HostConfig } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPairSuccess: (config: HostConfig) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onPairSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualUrl, setManualUrl] = useState('wss://192.168.1.100:8080/remote');
  const [manualToken, setManualToken] = useState('ag_sec_token_' + Math.floor(100000 + Math.random() * 900000));
  const [hostName, setHostName] = useState('Dell PC Server');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isOpen && activeTab === 'camera') {
      try {
        scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 240, height: 240 } },
          false
        );

        scanner.render(
          (decodedText) => {
            console.log('QR Code scanned:', decodedText);
            handleScannedText(decodedText);
            if (scanner) {
              scanner.clear().catch(console.error);
            }
          },
          (errorMessage) => {
            // frame scanning
          }
        );
      } catch (err: any) {
        console.warn('Scanner init warning:', err);
        setScanError('Không thể mở camera. Vui lòng cấp quyền hoặc dùng tab nhập mã thủ công.');
      }
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [isOpen, activeTab]);

  const handleScannedText = (text: string) => {
    try {
      setIsSuccess(true);
      setTimeout(() => {
        let url = 'wss://antigravity.remote/session';
        let token = 'ag_qr_token_' + Date.now();

        if (text.startsWith('http') || text.startsWith('ws')) {
          try {
            const parsed = new URL(text);
            url = parsed.origin + parsed.pathname;
            token = parsed.searchParams.get('token') || parsed.searchParams.get('session') || token;
          } catch {
            url = text;
          }
        }

        const newConfig: HostConfig = {
          id: 'host_' + Date.now(),
          name: hostName || 'Antigravity Host',
          url: url,
          token: token,
          isConnected: true,
          lastConnectedAt: new Date().toISOString(),
          model: 'Gemini 2.5 Flash',
          toolPolicy: 'request-review',
          systemStats: {
            cpuPercent: 12,
            ramPercent: 35,
            platform: 'Remote Server',
          },
        };

        onPairSuccess(newConfig);
        setIsSuccess(false);
        onClose();
      }, 900);
    } catch {
      setScanError('Định dạng mã QR không hợp lệ.');
    }
  };

  const handleManualConnect = () => {
    setIsSuccess(true);
    setTimeout(() => {
      const newConfig: HostConfig = {
        id: 'host_' + Date.now(),
        name: hostName || 'Dell PC Server',
        url: manualUrl,
        token: manualToken,
        isConnected: true,
        lastConnectedAt: new Date().toISOString(),
        model: 'Gemini 2.5 Flash',
        toolPolicy: 'request-review',
        systemStats: {
          cpuPercent: 15,
          ramPercent: 40,
          platform: 'Windows Server 2025',
        },
      };

      onPairSuccess(newConfig);
      setIsSuccess(false);
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-white border border-gray-200 rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Ghép Đôi Remote Control</h3>
            <p className="text-xs text-gray-500 mt-0.5">Kết nối tới máy tính server của bạn</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 p-1 bg-gray-100">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'camera' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Quét mã QR</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            <span>Nhập link thủ công</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce mb-2" />
              <h4 className="text-base font-bold text-gray-900">Ghép Đôi Thành Công!</h4>
              <p className="text-xs text-gray-600 mt-1">Đang chuyển về giao diện điều khiển máy chủ...</p>
            </div>
          ) : activeTab === 'camera' ? (
            <div>
              <p className="text-xs text-gray-600 text-center mb-3 leading-relaxed">
                Mở app Antigravity trên PC ➔ Bật <b>Remote Control</b> và hướng camera vào mã QR hiển thị trên màn hình.
              </p>

              {/* Camera Scanner View Container */}
              <div
                id="qr-reader-container"
                className="w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-300 min-h-[220px]"
              ></div>

              {scanError && (
                <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}

              {/* Quick test button */}
              <button
                onClick={() => handleScannedText('https://antigravity.google/remote?session=sess_server_dell&token=ag_qr_99182')}
                className="w-full mt-3.5 flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 rounded-xl transition border border-gray-300"
              >
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>Mô phỏng quét mã QR thành công</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Tên máy chủ:</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Địa chỉ Host / WebSocket URL:</label>
                <input
                  type="text"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="wss://192.168.1.100:8080/remote"
                  className="w-full mt-1.5 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Pairing Token:</label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-blue-500 font-mono font-medium"
                />
              </div>

              <button
                onClick={handleManualConnect}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md transition"
              >
                Kết Nối Máy Chủ Ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
