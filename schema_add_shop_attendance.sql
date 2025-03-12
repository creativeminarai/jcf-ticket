-- Shop出店日テーブル作成のSQL

-- Shop出店日テーブル
CREATE TABLE IF NOT EXISTS "ShopAttendance" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "shop_id" UUID NOT NULL REFERENCES "Shop"("id"),
  "event_date_id" UUID NOT NULL REFERENCES "EventDate"("id"),
  "notes" TEXT DEFAULT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE("shop_id", "event_date_id")
);

-- 自動更新トリガー設定
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ShopAttendance_updated_at ON "ShopAttendance";
CREATE TRIGGER update_ShopAttendance_updated_at
BEFORE UPDATE ON "ShopAttendance"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- shopテーブルのshop_codeカラムからバイナリ部分を削除するためのマイグレーションも必要に応じて追加
-- 既存データの移行スクリプト
/*
-- 既存のshop_codeからattendance情報を抽出してShopAttendanceテーブルに移行するSQL
-- 注意: このSQLはデータマイグレーション用であり、実行前に十分なテストが必要
DO $$
DECLARE
  shop_record RECORD;
  attendance_array TEXT;
  event_date_record RECORD;
  char_pos INTEGER;
BEGIN
  FOR shop_record IN SELECT * FROM "Shop" WHERE "deleted_at" IS NULL LOOP
    -- shop_codeからattendance部分を抽出（最後の7文字）
    IF length(shop_record.shop_code) >= 7 THEN
      attendance_array := right(shop_record.shop_code, 7);
      
      -- 各ビットをチェックして出店日を登録
      FOR char_pos IN 1..7 LOOP
        IF substr(attendance_array, char_pos, 1) = '1' THEN
          -- 対応するイベント日を見つける（実際のクエリはイベントの日付に基づく必要がある）
          -- この例では、単純にインデックスベースで処理
          FOR event_date_record IN 
            SELECT * FROM "EventDate" 
            WHERE "event_id" = (SELECT "event_id" FROM "Shop" WHERE "id" = shop_record.id)
            ORDER BY "date"
            LIMIT 1 OFFSET (7 - char_pos)
          LOOP
            -- ShopAttendanceに登録
            INSERT INTO "ShopAttendance" 
              ("shop_id", "event_date_id", "created_at", "updated_at")
            VALUES 
              (shop_record.id, event_date_record.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT ("shop_id", "event_date_id") DO NOTHING;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- shopテーブルのshop_codeフォーマット更新（ハイフン区切り、出店日情報なし）
UPDATE "Shop"
SET "shop_code" = regexp_replace("shop_code", '([0-9]{3})([a-z][0-9]{4})([0-9]{7})', '\1-\2')
WHERE "deleted_at" IS NULL;
*/
