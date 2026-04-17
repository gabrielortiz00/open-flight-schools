export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  part_61: boolean;
  part_141: boolean;
  website: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  certifications: { cert_type: string }[];
  pricing: { cert_type: string; price_low: number | null; price_high: number | null }[];
}