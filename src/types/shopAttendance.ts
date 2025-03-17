/**
 * 出店日テーブルの型定義
 */
export type ShopAttendance = {
  id: string;
  shop_id: string;
  event_date_id: string;
  notes?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * イベント日と出店情報を組み合わせた型
 */
export type EventDateWithAttendance = {
  id: string;
  date: string;
  time?: string;
  event_id: string;
  isAttending?: boolean; // 出店するかどうかのフラグ
  shopAttendanceId?: string; // 対応するShopAttendanceのID
  shopAttendanceNotes?: string; // 出店に関する備考
};
