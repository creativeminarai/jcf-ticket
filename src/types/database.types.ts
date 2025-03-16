export type Shop = {
  id: string;
  shop_code: string;
  shop_name: string;
  coffee_name: string;
  greeting: string;
  roast_level: string;
  pr_url: string;
  destiny_ratio: number;
  ticket_count: number;
  image_url: string | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
};

export type Event = {
  id: string;
  name: string;
  theme?: string;
  event_venue_id?: string;
  status?: "draft" | "published" | "closed";
  event_url?: string;
  image_url?: string;
  event_number?: number;
  deleted_at?: string | null;
  EventDate?: EventDate[]; // イベント日付の配列
};

export type EventVenue = {
  id: string;
  country: string;
  prefecture: string;
  city: string;
  reception_location: string;
  deleted_at?: string | null;
};

export type EventDate = {
  id: string;
  date: string;
  time: string;
  event_id: string;
  deleted_at?: string | null;
};

export type EventWithDates = Event & {
  EventVenue?: EventVenue;
  EventDate?: EventDate;
};

export type Ticket = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  event_id: string;
  status: "available" | "sold_out" | "closed";
  created_at?: string;
  updated_at?: string;
};

export type TicketType = {
  id: string;
  title: string;
  description: string;
  ticket_category: "当日券" | "前売り券" | "追加券";
  quantity: number;
  created_at?: string;
  updated_at?: string;
};

export type TicketPrice = {
  id: string;
  ticket_type_id: string;
  price: number;
  valid_from: string;
  valid_until: string;
  created_at?: string;
  updated_at?: string;
};

// Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Shop: {
        Row: Shop
        Insert: Omit<Shop, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Shop, "id">>
      }
      Event: {
        Row: Event
        Insert: Omit<Event, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Event, "id">>
      }
      Ticket: {
        Row: Ticket
        Insert: Omit<Ticket, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Ticket, "id">>
      }
      TicketType: {
        Row: TicketType
        Insert: Omit<TicketType, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<TicketType, "id">>
      }
      TicketPrice: {
        Row: TicketPrice
        Insert: Omit<TicketPrice, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<TicketPrice, "id">>
      }
    }
  }
}