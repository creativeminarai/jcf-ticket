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
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          location: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          location?: string;
          description?: string;
          created_at?: string;
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
};
