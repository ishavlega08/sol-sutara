import client from "./client";
import type { GetShipmentsResponse, GetShipmentResponse, CreateShipmentPayload } from "@/types/shipment";

export async function getShipments(params?: {
  search?: string; status?: string; priority?: string; supplierId?: string; page?: number; limit?: number;
}): Promise<GetShipmentsResponse> {
  const res = await client.get("/shipments", { params });
  return res.data;
}

export async function getShipmentById(id: string): Promise<GetShipmentResponse> {
  const res = await client.get(`/shipments/${id}`);
  return res.data;
}

export async function createShipment(payload: CreateShipmentPayload) {
  const res = await client.post("/shipments", payload);
  return res.data;
}

export async function updateShipmentStatus(id: string, status: string, location?: string, notes?: string) {
  const res = await client.patch(`/shipments/${id}/status`, { status, location, notes });
  return res.data;
}

export async function updateShipment(id: string, payload: Partial<CreateShipmentPayload>) {
  const res = await client.patch(`/shipments/${id}`, payload);
  return res.data;
}
