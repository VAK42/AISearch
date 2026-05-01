"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import ChatWindow from "../components/chatWindow";
import DocumentPanel from "../components/documentPanel";
import { listSessions, getChatHistory } from "../lib/apiClient";
type SessionItem = {
  sessionId: number;
  title: string;
};
type DocumentItem = {
  id: number;
  fileName: string;
  fileType: string;
  uploadStatus: string;
  uploadedAt: string;
};
type SourceNode = {
  fileName: string;
  score: number;
  text: string;
};
type MessageItem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: string;
  sourceNodes?: SourceNode[];
};
export default function HomePage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeMessages, setActiveMessages] = useState<MessageItem[]>([]);
  useEffect(() => {
    listSessions().then(setSessions).catch(() => { });
  }, []);
  const handleSessionCreate = (session: SessionItem) => {
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.sessionId);
    setActiveMessages([]);
    setDocuments([]);
  };
  const handleSessionSelect = async (id: number) => {
    if (activeSessionId === id) return;
    setActiveSessionId(id);
    try {
      const data = await getChatHistory(id);
      const mapped: MessageItem[] = data.messages.map((m: { id: number; role: "user" | "assistant"; content: string; sourceNodes: SourceNode[] }) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
        sourceNodes: m.sourceNodes,
      }));
      setActiveMessages(mapped);
    } catch {
      setActiveMessages([]);
    }
  };
  const handleSessionRename = (id: number, newTitle: string) => {
    setSessions((prev) => prev.map((s) => (s.sessionId === id ? { ...s, title: newTitle } : s)));
  };
  const handleSessionDelete = (id: number) => {
    setSessions((prev) => prev.filter((s) => s.sessionId !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setActiveMessages([]);
      setDocuments([]);
    }
  };
  return (
    <main className="flex h-screen w-full bg-white overflow-hidden">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionCreate={handleSessionCreate}
        onSessionRename={handleSessionRename}
        onSessionDelete={handleSessionDelete}
      />
      <div className="flex flex-1 overflow-hidden">
        <ChatWindow sessionId={activeSessionId} initialMessages={activeMessages} />
        <DocumentPanel
          sessionId={activeSessionId}
          documents={documents}
          onDocumentsChange={setDocuments}
        />
      </div>
    </main>
  )
}