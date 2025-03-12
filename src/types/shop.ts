/**
 * 店舗関連の型定義
 */

export interface Shop {
  id: string;
  shop_code: string;
  name: string;
  owner_name: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  event_id?: string; // イベントへの参照を追加
}

export interface EventDate {
  id: string;
  date: string;
  time: string;
  event_id: string;
  deleted_at?: string | null;
}

export interface Event {
  id: string;
  name: string;
  theme?: string;
  event_venue_id?: string;
  status?: "draft" | "published" | "closed";
  event_url?: string;
  image_url?: string;
  event_number?: number;
  EventDate?: EventDate[];
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShopFormData {
  name: string;
  shop_code: string; // 表示・入力用
  shop_type: string;
  owner_name: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  attendance: {
    [key: string]: boolean; // 日付ごとの出席状況
  };
  attendance_pattern?: string; // 特殊パターン用
}
