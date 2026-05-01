"use client";
import { Upload, FileText, CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { uploadDocument, listDocuments } from "../lib/apiClient";
type DocumentItem = {
  id: number;
  fileName: string;
  fileType: string;
  uploadStatus: string;
  uploadedAt: string;
};
type documentPanelProps = {
  sessionId: number | null;
  documents: DocumentItem[];
  onDocumentsChange: (docs: DocumentItem[]) => void;
};
export default function DocumentPanel({ sessionId, documents, onDocumentsChange }: documentPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allowedTypes = [".pdf", ".docx", ".pptx", ".txt"];
  const refreshDocuments = useCallback(async () => {
    if (!sessionId) return [];
    const data = await listDocuments(sessionId);
    onDocumentsChange(data);
    return data as DocumentItem[];
  }, [sessionId, onDocumentsChange]);
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      const data = await refreshDocuments();
      const allSettled = data.every((d: DocumentItem) => d.uploadStatus === "done" || d.uploadStatus === "error");
      if (allSettled && pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 3000);
  }, [refreshDocuments]);
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (sessionId) refreshDocuments();
  }, [sessionId, refreshDocuments]);
  useEffect(() => {
    const hasPending = documents.some((d) => d.uploadStatus === "indexing");
    if (hasPending) startPolling();
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [documents, startPolling]);
  const handleUpload = async (file: File) => {
    if (!sessionId) { setErrorMsg("Vui Lòng Chọn Phiên Hội Thoại Trước"); return; }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) { setErrorMsg(`Định Dạng Tệp Không Được Hỗ Trợ: ${ext}`); return; }
    setIsUploading(true);
    setErrorMsg("");
    try {
      await uploadDocument(file, sessionId);
      await refreshDocuments();
      startPolling();
    } catch {
      setErrorMsg("Tải Lên Tài Liệu Thất Bại");
    } finally {
      setIsUploading(false);
    }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };
  const statusIcon = (status: string) => {
    if (status === "done") return <CheckCircle size={14} className="text-green-950 shrink-0" />;
    if (status === "indexing") return <Clock size={14} className="text-green-950 animate-spin shrink-0" />;
    return <AlertCircle size={14} className="text-green-950 shrink-0" />;
  };
  return (
    <aside className="w-72 border-l border-green-950 flex flex-col h-full">
      <div className="p-4 border-b border-green-950">
        <h2 className="text-sm font-semibold text-green-950">Tài Liệu</h2>
      </div>
      <div className="p-4 border-b border-green-950">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => sessionId && fileInputRef.current?.click()}
          className={`border border-green-950 rounded p-4 flex flex-col items-center gap-2 transition-all ${sessionId ? "cursor-pointer" : "cursor-not-allowed opacity-40"} ${isDragging ? "bg-green-950 text-white" : "bg-white text-green-950 hover:bg-green-950 hover:text-white"}`}
        >
          <Upload size={20} />
          <span className="text-xs text-center">
            {isUploading ? "Đang Tải Lên..." : sessionId ? "Kéo Thả Hoặc Chọn Tệp" : "Chọn Phiên Hội Thoại Trước"}
          </span>
          <span className="text-xs opacity-60">PDF, DOCX, PPTX, TXT</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.pptx,.txt"
          onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
        />
        {errorMsg && (
          <div className="mt-2 flex items-center gap-1 text-xs text-green-950 border border-green-950 rounded p-2">
            <X size={12} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {!sessionId && (
          <p className="text-xs text-center text-green-950 opacity-50 mt-8">Chọn Phiên Để Xem Tài Liệu</p>
        )}
        {sessionId && documents.length === 0 && (
          <p className="text-xs text-center text-green-950 opacity-50 mt-8">Chưa Có Tài Liệu Nào</p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-2 p-2 rounded border border-green-950 mb-2">
            <FileText size={14} className="shrink-0 text-green-950" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-green-950">{doc.fileName}</p>
              <p className="text-xs text-green-950 opacity-60">{doc.fileType.toUpperCase()}</p>
            </div>
            {statusIcon(doc.uploadStatus)}
          </div>
        ))}
      </div>
    </aside>
  )
}