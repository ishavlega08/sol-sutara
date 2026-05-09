import client from "./client";
import type {
  CreateComponentPayload,
  CreateComponentResponse,
  GetComponentsResponse,
  GetComponentByIdResponse,
  GetChildrenResponse,
  GetTraceResponse,
  GetAffectedResponse,
  GetRiskResponse,
  GetAnalyticsResponse,
  GetDashboardStatsResponse,
  GetRecentLinksResponse,
  GetBatchRiskResponse,
  GetAllLinksResponse,
  GetTimeSeriesResponse,
  GetEventsResponse,
  PatchStatusPayload,
  GetVerifyResponse,
  GetActiveRecallsResponse,
  CreateRecallPayload,
  CreateRecallResponse,
} from "@/types/component";

export async function createComponent(
  data: CreateComponentPayload
): Promise<CreateComponentResponse> {
  const res = await client.post<CreateComponentResponse>("/components", data);
  return res.data;
}

export async function getComponents(): Promise<GetComponentsResponse> {
  const res = await client.get<GetComponentsResponse>("/components");
  return res.data;
}

export async function getComponentById(id: string): Promise<GetComponentByIdResponse> {
  const res = await client.get<GetComponentByIdResponse>(`/components/${id}`);
  return res.data;
}

export async function getComponentChildren(id: string): Promise<GetChildrenResponse> {
  const res = await client.get<GetChildrenResponse>(`/components/${id}/children`);
  return res.data;
}

export async function getComponentTrace(id: string): Promise<GetTraceResponse> {
  const res = await client.get<GetTraceResponse>(`/components/${id}/trace`);
  return res.data;
}

export async function getComponentAffected(id: string): Promise<GetAffectedResponse> {
  const res = await client.get<GetAffectedResponse>(`/components/${id}/affected`);
  return res.data;
}

export async function getComponentRisk(id: string): Promise<GetRiskResponse> {
  const res = await client.get<GetRiskResponse>(`/components/${id}/risk`);
  return res.data;
}

export async function getAnalytics(period?: string): Promise<GetAnalyticsResponse> {
  const res = await client.get<GetAnalyticsResponse>("/analytics", {
    params: period ? { period } : {},
  });
  return res.data;
}

export async function getDashboardStats(): Promise<GetDashboardStatsResponse> {
  const res = await client.get<GetDashboardStatsResponse>("/dashboard/stats");
  return res.data;
}

export async function getRecentLinks(limit = 10): Promise<GetRecentLinksResponse> {
  const res = await client.get<GetRecentLinksResponse>("/dashboard/links", { params: { limit } });
  return res.data;
}

export async function getBatchRisk(): Promise<GetBatchRiskResponse> {
  const res = await client.get<GetBatchRiskResponse>("/dashboard/risks");
  return res.data;
}

export async function getAllLinks(): Promise<GetAllLinksResponse> {
  const res = await client.get<GetAllLinksResponse>("/dashboard/links/all");
  return res.data;
}

export async function getTimeSeries(weeks = 14): Promise<GetTimeSeriesResponse> {
  const res = await client.get<GetTimeSeriesResponse>("/analytics/timeseries", { params: { weeks } });
  return res.data;
}

export async function getComponentEvents(id: string): Promise<GetEventsResponse> {
  const res = await client.get<GetEventsResponse>(`/components/${id}/events`);
  return res.data;
}

export async function patchComponentStatus(id: string, data: PatchStatusPayload): Promise<{ success: boolean }> {
  const res = await client.patch<{ success: boolean }>(`/components/${id}/status`, data);
  return res.data;
}

export async function verifyComponent(id: string): Promise<GetVerifyResponse> {
  const res = await client.get<GetVerifyResponse>(`/components/${id}/verify`);
  return res.data;
}

export async function getActiveRecalls(): Promise<GetActiveRecallsResponse> {
  const res = await client.get<GetActiveRecallsResponse>("/recalls");
  return res.data;
}

export async function createRecall(data: CreateRecallPayload): Promise<CreateRecallResponse> {
  const res = await client.post<CreateRecallResponse>("/recalls", data);
  return res.data;
}

export async function resolveRecall(id: string): Promise<{ success: boolean }> {
  const res = await client.patch<{ success: boolean }>(`/recalls/${id}/resolve`);
  return res.data;
}
