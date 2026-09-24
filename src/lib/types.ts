export interface Doctor {
  id: string;
  clinic_id?: string;
  first_name: string;
  last_name: string;
  name?: string;
  specialty: string;
  experience_years?: number;
  experience?: number;
  rating?: number;
  reviews_count?: number;
  consultation_price?: number;
  price?: number;
  photo_url?: string | null;
  photo?: string | null;
  languages?: string[];
  description?: string | null;
  source_url?: string | null;
  clinic_has_online_booking?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string | null;
  working_hours?: string | null;
  source_url?: string | null;
  photo_url?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviews_count?: number | null;
  has_online_booking?: boolean;
  has_active_promotion?: boolean;
}

export interface Service {
  id: string;
  name_raw: string;
  name_norm?: string | null;
  category: string;
}

export interface Price {
  id: string;
  clinic_id: string;
  service_id: string;
  price_kzt: number;
  parsed_at?: string | null;
  clinic: Clinic;
  service: Service;
}

export interface SearchResult {
  service: Service;
  avg_price: number;
  min_price: number;
  clinics_count: number;
  best_offer_clinic?: Clinic | null;
  best_offer_price?: number | null;
  last_updated_at?: string | null;
}

export interface ClinicDetail {
  clinic: Clinic;
  services: Price[];
  doctors: Doctor[];
}
