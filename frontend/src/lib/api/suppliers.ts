import client from "./client";
import type { GetSuppliersResponse, GetSupplierResponse, CreateSupplierPayload } from "@/types/supplier";

export async function getSuppliers(params?: {
  search?: string; status?: string; risk_level?: string; page?: number; limit?: number;
}): Promise<GetSuppliersResponse> {
  const res = await client.get("/suppliers", { params });
  return res.data;
}

export async function getSupplierById(id: string): Promise<GetSupplierResponse> {
  const res = await client.get(`/suppliers/${id}`);
  return res.data;
}

export async function createSupplier(payload: CreateSupplierPayload) {
  const res = await client.post("/suppliers", payload);
  return res.data;
}

export async function updateSupplier(id: string, payload: Partial<CreateSupplierPayload & { risk_level?: string }>) {
  const res = await client.patch(`/suppliers/${id}`, payload);
  return res.data;
}

export async function updateSupplierStatus(id: string, status: string) {
  const res = await client.patch(`/suppliers/${id}/status`, { status });
  return res.data;
}

export async function deleteSupplier(id: string) {
  const res = await client.delete(`/suppliers/${id}`);
  return res.data;
}
