import React, { useState } from 'react';
import {
  Code2,
  X,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Download,
  FolderTree,
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { FLUTTER_STARTER_FILES, FlutterFile } from '../services/flutterExport';

interface FlutterSdkModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const FlutterSdkModal: React.FC<FlutterSdkModalProps> = ({
  isOpen,
  onClose,
  darkMode,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentFile: FlutterFile = FLUTTER_STARTER_FILES[selectedFileIndex] || FLUTTER_STARTER_FILES[0];

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleDownloadAllZipNotice = () => {
    // Downloads a combined starter template package
    const combinedContent = FLUTTER_STARTER_FILES.map(
      (f) => `// ==============================================================================\n// FILE: ${f.path}\n// DESC: ${f.description}\n// ==============================================================================\n\n${f.code}\n\n`
    ).join('\n');

    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'afronala_flutter_mobile_starter_bundle.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-5xl h-[88vh] flex flex-col justify-between rounded-2xl border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Flutter Mobile Driver &amp; Rider Starter Suite</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  DART 3.x
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete multi-file architecture with Back4App Parse Cloud, LiveQuery streams, and AmbaLay Maps.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Split: File Explorer Tree (Left) vs Code Viewer (Right) */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 sm:w-72 border-r border-slate-800/80 bg-slate-950/40 p-4 overflow-y-auto space-y-4 shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                <span>Project Files ({FLUTTER_STARTER_FILES.length})</span>
              </span>
            </div>

            <div className="space-y-1">
              {FLUTTER_STARTER_FILES.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono text-left transition-all ${
                    selectedFileIndex === idx
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${selectedFileIndex === idx ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick integration summary */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-bold text-white block">Pre-wired SDKs:</span>
              <p>• Back4App Parse Client &amp; LiveQuery</p>
              <p>• AmbaLay Maps Ethiopia Client</p>
              <p>• Geolocator GPS Telemetry</p>
            </div>
          </div>

          {/* Code Viewer Viewport */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950">
            {/* Top file meta bar */}
            <div className="px-5 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-300">{currentFile.path}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-bold">
                    {currentFile.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{currentFile.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCurrent}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied File!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs text-cyan-300 leading-relaxed select-all">
              <pre className="whitespace-pre">{currentFile.code}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Target Runtime: Flutter 3.x / Dart 3.x on iOS &amp; Android</span>
            {downloadSuccess && (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Downloaded!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadAllZipNotice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Combined Bundle</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
