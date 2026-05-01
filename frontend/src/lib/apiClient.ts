const baseUrl = "http://localhost:8000";
export async function createSession() {
  const res = await fetch(`${baseUrl}/api/v1/chat/createSession`, { method: "POST" });
  if (!res.ok) throw new Error("Không Thể Tạo Phiên Hội Thoại");
  return res.json();
}
export async function listSessions() {
  const res = await fetch(`${baseUrl}/api/v1/chat/listAll`);
  if (!res.ok) throw new Error("Không Thể Tải Danh Sách Phiên");
  return res.json();
}
export async function renameSession(sessionId: number, title: string) {
  const res = await fetch(`${baseUrl}/api/v1/chat/rename/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Không Thể Đổi Tên Phiên");
  return res.json();
}
export async function deleteSession(sessionId: number) {
  const res = await fetch(`${baseUrl}/api/v1/chat/delete/${sessionId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Không Thể Xóa Phiên");
  return res.json();
}
export async function sendQuery(sessionId: number, messageText: string) {
  const res = await fetch(`${baseUrl}/api/v1/chat/sendQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, messageText }),
  });
  if (!res.ok) throw new Error("Không Thể Gửi Câu Hỏi");
  return res.json();
}
export async function getChatHistory(sessionId: number) {
  const res = await fetch(`${baseUrl}/api/v1/chat/history/${sessionId}`);
  if (!res.ok) throw new Error("Không Thể Tải Lịch Sử Hội Thoại");
  return res.json();
}
export async function uploadDocument(file: File, sessionId: number) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("sessionId", String(sessionId));
  const res = await fetch(`${baseUrl}/api/v1/documents/uploadFile`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Tải Lên Tài Liệu Thất Bại");
  return res.json();
}
export async function listDocuments(sessionId: number) {
  const res = await fetch(`${baseUrl}/api/v1/documents/listAll?sessionId=${sessionId}`);
  if (!res.ok) throw new Error("Không Thể Tải Danh Sách Tài Liệu");
  return res.json();
}