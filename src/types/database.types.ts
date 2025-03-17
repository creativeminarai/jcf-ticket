export type Database = {
  public: {
    Tables: {
      Event: {
        Row: {
          id: string;
          name: string;
          date: string;
          location: string;
          description?: string;
          created_at?: string;
          event_number?: number;
          deleted_at?: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          location: string;
          description?: string;
          created_at?: string;
          event_number?: number;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          location?: string;
          description?: string;
          created_at?: string;
          event_number?: number;
          deleted_at?: string | null;
        };
      };
      EventDate: {
        Row: {
          id: string;
          event_id: string;
          date: string;
          deleted_at: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          date: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          date?: string;
          deleted_at?: string | null;
          created_at?: string;
        };
      };
      Shop: {
        Row: {
          id: string;
          shop_code: string;
          shop_name: string;
          image_url: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          destiny_ratio?: number;
        };
        Insert: {
          id?: string;
          shop_code: string;
          shop_name: string;
          image_url?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          destiny_ratio?: number;
        };
        Update: {
          id?: string;
          shop_code?: string;
          shop_name?: string;
          image_url?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          destiny_ratio?: number;
        };
      };
      ShopAttendance: {
        Row: {
          id: string;
          shop_id: string;
          event_date_id: string;
          deleted_at: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          event_date_id: string;
          deleted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          event_date_id?: string;
          deleted_at?: string | null;
          created_at?: string;
        };
      };
      FateTicket: {
        Row: {
          id: string;
          event_id: string;
          event_date_id: string;
          shop_id: string;
          batch_id: number;
          fate_position: number;
          drawn_by_id: string | null;
          drawn_at: string | null;
          created_at?: string;
          Shop?: {
            shop_name?: string;
            shop_code?: string;
          };
        };
        Insert: {
          id?: string;
          event_id: string;
          event_date_id: string;
          shop_id: string;
          batch_id: number;
          fate_position: number;
          drawn_by_id?: string | null;
          drawn_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_date_id?: string;
          shop_id?: string;
          batch_id?: number;
          fate_position?: number;
          drawn_by_id?: string | null;
          drawn_at?: string | null;
          created_at?: string;
        };
      };
      FateBatch: {
        Row: {
          id: number;
          event_id: string;
          event_date_id: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          event_id: string;
          event_date_id: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          event_id?: string;
          event_date_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      TicketType: {
        Row: {
          id: string;
          name: string;
          price: number;
          event_id: string;
          ticket_category: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          event_id: string;
          ticket_category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          event_id?: string;
          ticket_category?: string;
          created_at?: string;
        };
      };
      PurchaseHistory: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          ticket_type_id: string;
          purchase_date: string;
          quantity: number;
          payment_id: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          ticket_type_id: string;
          purchase_date: string;
          quantity: number;
          payment_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          ticket_type_id?: string;
          purchase_date?: string;
          quantity?: number;
          payment_id?: string;
          created_at?: string;
        };
      };
      AllStoreTicket: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          shop_id: string | null;
          used_at: string | null;
          created_at?: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          shop_id?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          shop_id?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name?: string;
          created_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
    };
  };
};

// イベントと日付情報を含む拡張型
export type EventWithDates = Database['public']['Tables']['Event']['Row'] & {
  status?: 'draft' | 'published' | 'closed';
  dates?: Array<{
    date: string;
    time: string;
  }>;
  EventDate?: Database['public']['Tables']['EventDate']['Row'][];
  event_number?: number;
};
