import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Clipboard, Check, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { workspaceStore } from '../services/workspaceStore';

interface CameraQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceAdded: (url: string, name?: string) => void;
}

export const CameraQRScanner: React.FC<CameraQRScannerProps> = ({
  isOpen,
  onClose,
  onWorkspaceAdded,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [projectName, setProjectName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pasted, setPasted] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setCameraError(null);
      isStoppingRef.current = false;
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      // Wait for DOM element
      await new Promise((r) => setTimeout(r, 200));
      const el = document.getElementById('qr-camera-viewport');
      if (!el) return;

      const html5QrCode = new Html5Qrcode('qr-camera-viewport');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          // Trigger Haptic
          try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
          } catch {}

          // Stop scanner
          await stopScanner();

          // Auto-parse & Add
          const parsed = workspaceStore.parseGoogleRemoteUrl(decodedText);
          onWorkspaceAdded(parsed.url, projectName.trim() || parsed.suggestedName);
          onClose();
        },
        () => {
          // ignore scan frame errors
        }
      );
    } catch (err: any) {
      setCameraError('Không thể mở camera. Vui lòng cấp quyền hoặc dán link bên dưới.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setManualInput(text);
        const parsed = workspaceStore.parseGoogleRemoteUrl(text);
        if (parsed.suggestedName && !projectName) {
          setProjectName(parsed.suggestedName);
        }
        setPasted(true);
        setTimeout(() => setPasted(false), 2000);
      }
    } catch {
      // clipboard access denied
    }
  };

  const handleSubmitManual = () => {
    if (!manualInput.trim()) return;
    const parsed = workspaceStore.parseGoogleRemoteUrl(manualInput);
    onWorkspaceAdded(parsed.url, projectName.trim() || parsed.suggestedName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl flex flex-col z-10 shadow-2xl overflow-hidden max-h-[92vh] border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Camera className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Quét Mã QR Antigravity</h3>
              <p className="text-xs text-gray-500">Hướng camera về mã QR trên máy tính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Camera Viewport Area */}
          <div className="relative w-full aspect-square max-h-[280px] bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
            <div id="qr-camera-viewport" className="w-full h-full" />

            {/* Viewfinder Overlay Reticle */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-2xl flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-blue-500/80 rounded-2xl relative shadow-lg">
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" />
              </div>
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-gray-900/90 text-white p-5 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs text-gray-300 leading-relaxed max-w-xs">{cameraError}</p>
                <button
                  onClick={startScanner}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-xl text-xs font-bold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Or Paste Link Directly */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Hoặc dán liên kết Google Remote:</label>
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-800"
              >
                {pasted ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
                <span>{pasted ? 'Đã dán!' : 'Dán từ bộ nhớ tạm'}</span>
              </button>
            </div>

            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="https://accounts.google.com/AccountChooser?...continue=https://antigravity.google.com/r/..."
              rows={2}
              className="w-full p-2.5 text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 text-gray-800 resize-none shadow-xs"
            />

            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Tên gợi nhớ cho dự án (ví dụ: antigravity-app, cleanyourtv...)"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 text-gray-800 shadow-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition"
          >
            Đóng
          </button>
          <button
            onClick={handleSubmitManual}
            disabled={!manualInput.trim()}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            Mở Dự Án Này
          </button>
        </div>
      </div>
    </div>
  );
};
