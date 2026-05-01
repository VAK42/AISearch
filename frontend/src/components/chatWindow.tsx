"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendQuery } from "../lib/apiClient";
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
type chatWindowProps = {
  sessionId: number | null;
  initialMessages: MessageItem[];
};
export default function ChatWindow({ sessionId, initialMessages }: chatWindowProps) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages(initialMessages);
    setInputText("");
  }, [sessionId, initialMessages]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleSend = async () => {
    if (!inputText.trim() || !sessionId || isLoading) return;
    const userMsg: MessageItem = { id: Date.now().toString(), role: "user", content: inputText };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    try {
      const data = await sendQuery(sessionId, inputText);
      const assistantMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        source: data.source,
        sourceNodes: data.sourceNodes,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: MessageItem = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xảy Ra Lỗi Khi Xử Lý Câu Hỏi. Vui Lòng Thử Lại!",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {messages.length === 0 && !sessionId && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <p className="text-sm text-green-950">Tạo Phiên Hội Thoại Để Bắt Đầu</p>
          </div>
        )}
        {messages.length === 0 && sessionId && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <p className="text-sm text-green-950">Đặt Câu Hỏi Về Tài Liệu Của Bạn</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xl ${msg.role === "user" ? "bg-green-950 text-white shadow-lg" : "bg-white text-green-950 border border-green-950 shadow-sm"} rounded p-4 transition-all hover:shadow-md`}>
              <div className={`text-sm ${msg.role === "user" ? "" : "prose prose-sm max-w-none prose-green prose-p:leading-relaxed prose-pre:bg-green-50 prose-pre:text-green-900 prose-strong:text-inherit"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === "assistant" && msg.source && (
                <div className="mt-2 pt-2 border-t border-green-100">
                  <span className={`text-xs px-2 py-0.5 rounded ${msg.source === "MCP" ? "bg-blue-100 text-blue-700" : msg.source === "RAG + MCP" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-800"}`}>
                    {msg.source}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-green-950 rounded p-3 flex items-center gap-2">
              <Loader size={14} className="text-green-950 animate-spin" />
              <span className="text-sm text-green-950">Đang Xử Lý...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-green-950">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={Boolean(sessionId === null || isLoading)}
            placeholder={sessionId ? "Nhập Câu Hỏi Của Bạn..." : "Tạo Phiên Hội Thoại Trước"}
            rows={2}
            suppressHydrationWarning
            className="flex-1 border border-green-950 rounded p-3 text-sm text-green-950 bg-white resize-none outline-none placeholder:text-green-950 placeholder:opacity-40 disabled:opacity-40 cursor-text"
          />
          <button
            onClick={handleSend}
            disabled={Boolean(sessionId === null || !inputText.trim() || isLoading)}
            className="border border-green-950 rounded p-3 bg-green-950 text-white hover:bg-white hover:text-green-950 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}