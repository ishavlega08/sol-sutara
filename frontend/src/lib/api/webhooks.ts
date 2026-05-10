import client from "./client";
import type { Webhook } from "@/types/shipment";

export async function getWebhooks(): Promise<{ success: boolean; webhooks: Webhook[] }> {
  const res = await client.get("/webhooks");
  return res.data;
}

export async function getWebhookById(id: string) {
  const res = await client.get(`/webhooks/${id}`);
  return res.data;
}

export async function createWebhook(payload: { url: string; events: string[] }) {
  const res = await client.post("/webhooks", payload);
  return res.data;
}

export async function updateWebhook(id: string, payload: { url?: string; events?: string[]; status?: string }) {
  const res = await client.patch(`/webhooks/${id}`, payload);
  return res.data;
}

export async function rotateWebhookSecret(id: string) {
  const res = await client.post(`/webhooks/${id}/rotate-secret`);
  return res.data;
}

export async function deleteWebhook(id: string) {
  const res = await client.delete(`/webhooks/${id}`);
  return res.data;
}

export async function getWebhookEvents(): Promise<{ success: boolean; events: string[] }> {
  const res = await client.get("/webhooks/events");
  return res.data;
}

export async function retryWebhookDeliveries() {
  const res = await client.post("/webhooks/retry");
  return res.data;
}
