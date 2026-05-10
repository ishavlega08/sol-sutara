export type ShipmentStatus   = "CREATED" | "PICKED_UP" | "IN_TRANSIT" | "CUSTOMS_HOLD" | "DELAYED" | "DELIVERED" | "CANCELLED";
export type ShipmentPriority = "LOW" | "STANDARD" | "HIGH" | "URGENT";
export type DocumentType     = "INVOICE" | "CERTIFICATION" | "CUSTOMS" | "INSPECTION_REPORT" | "BILL_OF_LADING" | "OTHER";

export interface ShipmentEvent {
  id:          string;
  from_status: ShipmentStatus | null;
  to_status:   ShipmentStatus;
  location:    string | null;
  notes:       string | null;
  recorded_by: string;
  created_at:  string;
  recorder?:   { email: string | null };
}

export interface Shipment {
  id:                 string;
  org_id:             string;
  shipment_number:    string;
  supplier_id:        string | null;
  origin:             string;
  destination:        string;
  carrier:            string | null;
  tracking_number:    string | null;
  status:             ShipmentStatus;
  priority:           ShipmentPriority;
  estimated_delivery: string | null;
  actual_delivery:    string | null;
  notes:              string | null;
  created_at:         string;
  supplier?:          { company_name: string; supplier_code: string } | null;
  creator?:           { email: string | null };
  _count?:            { events: number; documents: number };
}

export interface ShipmentDetail extends Shipment {
  events:    ShipmentEvent[];
  documents: Array<{
    id:         string;
    name:       string;
    type:       string;
    file_url:   string;
    created_at: string;
  }>;
}

export interface Document {
  id:          string;
  org_id:      string;
  name:        string;
  type:        DocumentType;
  file_url:    string;
  file_size:   number | null;
  mime_type:   string | null;
  checksum:    string | null;
  shipment_id: string | null;
  supplier_id: string | null;
  uploaded_by: string;
  created_at:  string;
  uploader?:   { email: string | null };
}

export interface Notification {
  id:         string;
  user_id:    string;
  org_id:     string;
  title:      string;
  body:       string;
  type:       string;
  entity_id:  string | null;
  read:       boolean;
  created_at: string;
}

export interface Webhook {
  id:         string;
  org_id:     string;
  url:        string;
  secret:     string;
  events:     string[];
  status:     "ACTIVE" | "DISABLED";
  created_at: string;
  _count?:    { deliveries: number };
}

export interface WebhookDelivery {
  id:           string;
  event:        string;
  status:       "PENDING" | "SUCCESS" | "FAILED";
  status_code:  number | null;
  attempts:     number;
  created_at:   string;
  delivered_at: string | null;
}

export interface CreateShipmentPayload {
  supplierId?:        string;
  origin:             string;
  destination:        string;
  carrier?:           string;
  trackingNumber?:    string;
  priority?:          ShipmentPriority;
  estimatedDelivery?: string;
  notes?:             string;
}

export interface GetShipmentsResponse {
  success:    boolean;
  shipments:  Shipment[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface GetShipmentResponse {
  success:  boolean;
  shipment: ShipmentDetail;
}
