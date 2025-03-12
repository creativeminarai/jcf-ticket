-- ER図に従ってスキーマを修正するSQL
-- 1. Event_EventDate中間テーブルを削除し、Eventテーブルにevent_date_idを追加

-- バックアップとしてEvent_EventDateテーブルの内容を一時テーブルに保存
CREATE TEMPORARY TABLE event_date_relations AS
SELECT event_id, event_date_id FROM "Event_EventDate";

-- Event テーブルに event_date_id カラムを追加
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS event_date_id UUID REFERENCES "EventDate"(id);

-- EventDate テーブルのカラム名が間違っている場合の修正（もし既に正しければこれらは無視できます）
ALTER TABLE "EventDate" RENAME COLUMN event_date TO date;
ALTER TABLE "EventDate" RENAME COLUMN event_time TO time;

-- 各イベントの最初の日付をevent_date_idとして設定（例としての対応）
UPDATE "Event" e
SET event_date_id = r.event_date_id
FROM event_date_relations r
WHERE e.id = r.event_id
AND e.event_date_id IS NULL
AND r.event_date_id IN (
    SELECT DISTINCT ON (event_id) event_date_id
    FROM event_date_relations
    ORDER BY event_id, event_date_id
);

-- 不要になったEvent_EventDateテーブルを削除
DROP TABLE IF EXISTS "Event_EventDate";

-- 一時テーブルの削除
DROP TABLE event_date_relations;
