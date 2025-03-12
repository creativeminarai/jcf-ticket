-- Eventテーブルにステータスカラムを追加
ALTER TABLE "Event" 
ADD COLUMN status VARCHAR DEFAULT 'published' 
CHECK (status IN ('draft', 'published', 'closed'));

-- EventテーブルにイベントURLカラムを追加
ALTER TABLE "Event" 
ADD COLUMN event_url VARCHAR;

-- Eventテーブルにイベント画像URLカラムを追加
ALTER TABLE "Event" 
ADD COLUMN image_url VARCHAR;

-- Eventテーブルにイベント回数カラムを追加
ALTER TABLE "Event" 
ADD COLUMN event_number INTEGER;
