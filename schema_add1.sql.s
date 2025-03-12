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

-- コメント：設定されたデフォルト値と制約について
-- status: デフォルト値は'published'で、'draft'、'published'、'closed'のいずれかであることをCHECK制約で保証
-- event_url: イベントのWebページURLを保存
-- image_url: イベントの画像URLを保存
-- event_number: 「第○○回」の数値部分を保存