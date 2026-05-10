import client from "./client";
import type { Document } from "@/types/shipment";

export interface UploadDocumentPayload {
  name:        string;
  type:        string;
  fileBase64:  string;
  mimeType:    string;
  shipmentId?: string;
  supplierId?: string;
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<{ success: boolean; document: Document }> {
  const res = await client.post("/documents", payload);
  return res.data;
}

export async function getDocuments(params?: {
  shipmentId?: string; supplierId?: string; type?: string; page?: number; limit?: number;
}): Promise<{ success: boolean; documents: Document[]; total: number }> {
  const res = await client.get("/documents", { params });
  return res.data;
}

export async function getDocumentById(id: string): Promise<{ success: boolean; document: Document }> {
  const res = await client.get(`/documents/${id}`);
  return res.data;
}

export async function deleteDocument(id: string) {
  const res = await client.delete(`/documents/${id}`);
  return res.data;
}

// Helper: converts a File object to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload  = () => {
      const result = reader.result as string;
      // Strip data:mime/type;base64, prefix
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
  });
}
