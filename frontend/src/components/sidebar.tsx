"use client";
import { useState } from "react";
import { Plus, MessageSquare, BookOpen, Pencil, Trash2, Check, X } from "lucide-react";
import { createSession, renameSession, deleteSession } from "../lib/apiClient";
type SessionItem = {
  sessionId: number;
  title: string;
};
type sidebarProps = {
  sessions: SessionItem[];
  activeSessionId: number | null;
  onSessionSelect: (id: number) => void;
  onSessionCreate: (session: SessionItem) => void;
  onSessionRename: (id: number, title: string) => void;
  onSessionDelete: (id: number) => void;
};
export default function Sidebar({ sessions, activeSessionId, onSessionSelect, onSessionCreate, onSessionRename, onSessionDelete }: sidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const handleNewSession = async () => {
    setIsCreating(true);
    try {
      const session = await createSession();
      onSessionCreate(session);
    } catch {
      console.error("Không Thể Tạo Phiên Hội Thoại");
    } finally {
      setIsCreating(false);
    }
  };
  const startEdit = (s: SessionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.sessionId);
    setEditingTitle(s.title);
  };
  const confirmRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingId || !editingTitle.trim()) return;
    try {
      await renameSession(editingId, editingTitle.trim());
      onSessionRename(editingId, editingTitle.trim());
    } catch {
      console.error("Không Thể Đổi Tên Phiên");
    } finally {
      setEditingId(null);
    }
  };
  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };
  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
      onSessionDelete(id);
    } catch {
      console.error("Không Thể Xóa Phiên");
    }
  };
  return (
    <aside className="w-64 border-r border-green-950 flex flex-col h-full">
      <div className="p-4 border-b border-green-950 flex items-center gap-2">
        <BookOpen size={18} className="text-green-950" />
        <span className="text-sm font-semibold text-green-950">Hỏi Đáp AI</span>
      </div>
      <div className="p-3 border-b border-green-950">
        <button
          onClick={handleNewSession}
          disabled={isCreating}
          className="w-full flex items-center justify-center gap-2 border border-green-950 rounded p-2 text-sm text-green-950 bg-white hover:bg-green-950 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus size={15} />
          <span>Phiên Hội Thoại Mới</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {sessions.length === 0 && (
          <p className="text-xs text-center text-green-950 opacity-40 mt-8">Chưa Có Phiên Hội Thoại</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.sessionId}
            onClick={() => onSessionSelect(s.sessionId)}
            className={`group w-full flex items-center gap-2 p-2 rounded text-sm transition-all border cursor-pointer ${activeSessionId === s.sessionId ? "bg-green-950 text-white border-green-950" : "bg-white text-green-950 border-green-950 hover:bg-green-950 hover:text-white"}`}
          >
            <MessageSquare size={13} className="shrink-0" />
            {editingId === s.sessionId ? (
              <input
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => { if (e.key === "Enter") confirmRename(e as unknown as React.MouseEvent); if (e.key === "Escape") cancelEdit(e as unknown as React.MouseEvent); }}
                className="flex-1 bg-transparent border-b border-current outline-none text-xs"
              />
            ) : (
              <span className="flex-1 truncate text-left text-xs">{s.title}</span>
            )}
            {editingId === s.sessionId ? (
              <div className="flex gap-1 shrink-0">
                <button onClick={confirmRename} className="cursor-pointer opacity-70 hover:opacity-100"><Check size={12} /></button>
                <button onClick={cancelEdit} className="cursor-pointer opacity-70 hover:opacity-100"><X size={12} /></button>
              </div>
            ) : (
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => startEdit(s, e)} className="cursor-pointer opacity-70 hover:opacity-100"><Pencil size={12} /></button>
                <button onClick={(e) => handleDelete(s.sessionId, e)} className="cursor-pointer opacity-70 hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}