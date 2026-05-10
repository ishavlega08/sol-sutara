export type SupplierStatus = "PENDING_REVIEW" | "APPROVED" | "SUSPENDED" | "REJECTED";
export type SupplierRisk   = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Supplier {
  id:             string;
  org_id:         string;
  supplier_code:  string;
  company_name:   string;
  legal_name:     string | null;
  contact_email:  string | null;
  contact_phone:  string | null;
  country:        string | null;
  address:        string | null;
  status:         SupplierStatus;
  risk_level:     SupplierRisk;
  certifications: string[];
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
  creator?:       { email: string | null };
  _count?:        { shipments: number; components: number; documents: number };
}

export interface SupplierDetail extends Supplier {
  shipments: Array<{
    id:              string;
    shipment_number: string;
    status:          string;
    origin:          string;
    destination:     string;
    created_at:      string;
  }>;
  documents: Array<{
    id:         string;
    name:       string;
    type:       string;
    file_url:   string;
    created_at: string;
  }>;
}

export interface CreateSupplierPayload {
  company_name:    string;
  legal_name?:     string;
  contact_email?:  string;
  contact_phone?:  string;
  country?:        string;
  address?:        string;
  certifications?: string[];
  notes?:          string;
}

export interface GetSuppliersResponse {
  success:    boolean;
  suppliers:  Supplier[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface GetSupplierResponse {
  success:  boolean;
  supplier: SupplierDetail;
}
