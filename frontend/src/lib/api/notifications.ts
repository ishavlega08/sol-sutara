import client from "./client";
import type { Notification } from "@/types/shipment";

export async function getNotifications(unreadOnly = false): Promise<{ success: boolean; notifications: Notification[] }> {
  const res = await client.get("/notifications", { params: unreadOnly ? { unread: "true" } : {} });
  return res.data;
}

export async function getUnreadCount(): Promise<{ success: boolean; count: number }> {
  const res = await client.get("/notifications/unread-count");
  return res.data;
}

export async function markNotificationRead(id: string) {
  const res = await client.patch(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllRead() {
  const res = await client.post("/notifications/mark-all-read");
  return res.data;
}
