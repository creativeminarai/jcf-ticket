-- EventDateテーブルにevent_id列を追加
ALTER TABLE "EventDate"
ADD COLUMN event_id UUID REFERENCES "Event"(id);

-- 既存のデータを移行
-- 既存のイベントのevent_date_idの値をEventDateのevent_idに設定する
UPDATE "EventDate" AS ed
SET event_id = e.id
FROM "Event" AS e
WHERE ed.id = e.event_date_id;

-- Eventテーブルからevent_date_id列を削除
ALTER TABLE "Event"
DROP COLUMN event_date_id;
