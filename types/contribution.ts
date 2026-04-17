export interface ContributionData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  airport_id?: string | null;
  part_61: boolean;
  part_141: boolean;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  certifications?: string[];
  fleet?: string[];
  specialties?: string[];
  gi_bill?: boolean;
  intro_flight?: boolean;
  ground_school?: boolean;
  financing?: boolean;
  simulator?: boolean;
  simulator_notes?: string | null;
  founded_year?: number | null;
  hours?: string | null;
}

export interface Contribution {
  id: string;
  school_id: string | null;
  submitted_by: string;
  data: ContributionData;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewer_notes?: string | null;
}