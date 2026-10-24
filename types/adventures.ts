export type TripStatus = "dreaming" | "upcoming" | "memories";
export type BucketStatus = "wishlist" | "planned" | "completed";
export type Trip = {
  id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  timezone: string;
  description: string;
  status: TripStatus;
  cover_photo_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  revision: number;
};
export type Activity = {
  id: string; trip_id: string; date: string; start_time: string | null;
  title: string; location: string; description: string; notes: string;
  estimated_cost: string | null; currency: string | null; completed: boolean;
  sort_order: number; created_by: string; created_at: string; updated_at: string; revision: number;
};
export type BucketItem = {
  id: string; title: string; description: string; destination: string;
  status: BucketStatus; trip_id: string | null; activity_id: string | null;
  created_by: string; created_at: string; updated_at: string; revision: number;
};
export type Memory = {
  id: string; trip_id: string; caption: string; date: string; location: string;
  created_by: string; created_at: string; updated_at: string; revision: number;
};
export type Photo = {
  id: string; trip_id: string; memory_id: string | null; storage_path: string;
  mime_type: string; byte_size: number; ready: boolean; created_by: string; created_at: string;
};
export type Expense = {
  id: string; trip_id: string; description: string; amount: string; currency: string;
  paid_by: string; category: string; date: string; created_by: string;
  created_at: string; updated_at: string; revision: number;
};
export type Pair = { id: boolean; person_one: string; person_two: string; name_one: string; name_two: string };
export type ActionState = { error?: string; success?: string; fields?: Record<string, string> };
