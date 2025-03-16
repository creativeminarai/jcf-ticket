export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      AllStoreTicket: {
        Row: {
          id: string
          event_id: string
          user_id: string
          shop_id: string | null
          used_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          shop_id?: string | null
          used_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          shop_id?: string | null
          used_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      Event: {
        Row: {
          id: string
          name: string
          theme: string | null
          status: string
          image_url: string | null
          event_url: string | null
          event_number: number | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          theme?: string | null
          status?: string
          image_url?: string | null
          event_url?: string | null
          event_number?: number | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          theme?: string | null
          status?: string
          image_url?: string | null
          event_url?: string | null
          event_number?: number | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      EventDate: {
        Row: {
          id: string
          event_id: string
          date: string
          time: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          date: string
          time: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          date?: string
          time?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      PurchaseHistory: {
        Row: {
          id: string
          event_id: string
          user_id: string
          ticket_type_id: string
          purchase_date: string
          quantity: number
          payment_id: string
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          ticket_type_id: string
          purchase_date: string
          quantity: number
          payment_id: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          ticket_type_id?: string
          purchase_date?: string
          quantity?: number
          payment_id?: string
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      Shop: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          shop_code?: string
          shop_name?: string
          coffee_name?: string
          greeting?: string | null
          roast_level?: string
          pr_url?: string | null
          destiny_ratio?: number
          ticket_count?: number
          notes?: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          shop_code?: string
          shop_name?: string
          coffee_name?: string
          greeting?: string | null
          roast_level?: string
          pr_url?: string | null
          destiny_ratio?: number
          ticket_count?: number
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          shop_code?: string
          shop_name?: string
          coffee_name?: string
          greeting?: string | null
          roast_level?: string
          pr_url?: string | null
          destiny_ratio?: number
          ticket_count?: number
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      TicketType: {
        Row: {
          id: string
          name: string
          ticket_category: string
          description: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          ticket_category: string
          description?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          ticket_category?: string
          description?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      TicketPrice: {
        Row: {
          id: string
          ticket_type_id: string
          price: number
          valid_from: string
          valid_until: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_type_id: string
          price: number
          valid_from: string
          valid_until?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_type_id?: string
          price?: number
          valid_from?: string
          valid_until?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type EventWithDates = Database['public']['Tables']['Event']['Row'] & {
  EventDate: Database['public']['Tables']['EventDate']['Row'][]
}

export type Tables = Database['public']['Tables']
