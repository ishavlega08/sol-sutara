import client from "./client";
import type {
  LinkComponentPayload,
  LinkComponentResponse,
  GetParentsResponse,
} from "@/types/link";

export async function linkComponents(
  data: LinkComponentPayload
): Promise<LinkComponentResponse> {
  const res = await client.post<LinkComponentResponse>("/components/link", data);
  return res.data;
}

export async function getComponentParents(id: string): Promise<GetParentsResponse> {
  const res = await client.get<GetParentsResponse>(`/components/${id}/parents`);
  return res.data;
}
