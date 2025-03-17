-- FateTicketテーブルにevent_date_idカラムを追加するSQL

-- 1. カラムの追加
ALTER TABLE "FateTicket" 
ADD COLUMN "event_date_id" UUID REFERENCES "EventDate"(id);

-- 2. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_fate_ticket_event_date_id ON "FateTicket"("event_date_id");

-- 3. コメントの追加
COMMENT ON COLUMN "FateTicket"."event_date_id" IS 'イベント日ID - 特定の日付のくじ引きを管理するため';

-- 4. 既存データの移行に関する注意事項
/*
注意: このマイグレーションを実行した後、既存のFateTicketレコードにはevent_date_idがNULLとなります。
必要に応じて、以下のようなSQLを使用して既存データを更新してください：

UPDATE "FateTicket" ft
SET event_date_id = (
    SELECT ed.id 
    FROM "EventDate" ed 
    WHERE ed.event_id = ft.event_id 
    ORDER BY ed.date ASC 
    LIMIT 1
)
WHERE ft.event_date_id IS NULL;

ただし、上記のSQLは各イベントの最初の日付を割り当てるだけの簡易的な方法です。
実際の運用に合わせて適切なデータ移行戦略を検討してください。
*/ 