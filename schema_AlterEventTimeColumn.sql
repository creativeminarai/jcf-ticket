-- EventDate.event_timeをtime型からvarchar型に変更するSQL
ALTER TABLE "EventDate"
  ALTER COLUMN "event_time" TYPE varchar;

-- 以下は別途実行してください
-- 既存データを「HH:MM～HH:MM」形式に変換するクエリ
/*
UPDATE "EventDate"
SET "event_time" = 
  TO_CHAR("event_time"::time, 'HH24:MI') || '～' || 
  TO_CHAR(("event_time"::time + interval '6 hour'), 'HH24:MI')
WHERE "event_time" IS NOT NULL;
*/

-- 注意：上記の変換例は各イベントが6時間続くと仮定しています
-- 実際のイベント終了時間に合わせて調整してください
