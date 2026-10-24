import type { Activity, BucketItem, Expense, Memory, Pair, Photo, Trip } from "./adventures";

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      private_pair: Table<Pair>;
      trips: Table<Trip>;
      trip_activities: Table<Activity>;
      travel_bucket_items: Table<BucketItem>;
      travel_memories: Table<Memory>;
      travel_photos: Table<Photo>;
      travel_expenses: Table<Expense>;
      photo_cleanup: Table<{ storage_path: string; created_at: string }>;
    };
    Views: Record<never, never>;
    Functions: {
      is_pair_member: { Args: Record<never, never>; Returns: boolean };
      convert_bucket_item: { Args: { item_id: string; target_trip: string; target_date: string; expected_revision: number }; Returns: string };
      move_activity: { Args: { activity_id: string; direction: number; expected_revision: number }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
