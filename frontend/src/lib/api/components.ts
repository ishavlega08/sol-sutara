import client from "./client";
import type {
  CreateComponentPayload,
  CreateComponentResponse,
  GetComponentsResponse,
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
