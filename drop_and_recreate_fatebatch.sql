-- FateBatchテーブルを削除（関連するテーブルの外部キー制約も考慮）
-- まず、FateBatchを参照している可能性のあるテーブルの外部キー制約を確認
-- FateTicketテーブルがFateBatchを参照している

-- FateTicketテーブルの外部キー制約を削除
ALTER TABLE "FateTicket" DROP CONSTRAINT IF EXISTS "FateTicket_batch_id_fkey";

-- BatchQueueテーブルの外部キー制約を削除（もし存在する場合）
ALTER TABLE "BatchQueue" DROP CONSTRAINT IF EXISTS "BatchQueue_batch_id_fkey";

-- FateBatchテーブルを削除
DROP TABLE IF EXISTS "FateBatch";

-- FateBatchテーブルを連番IDで再作成
CREATE TABLE IF NOT EXISTS "FateBatch" (
    id SERIAL PRIMARY KEY,  -- UUIDから連番IDに変更
    batch_size INTEGER NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_fatebatch_status ON "FateBatch"(status);

-- FateTicketテーブルの外部キー制約を再作成
-- 注意: FateTicketテーブルのbatch_idカラムの型も変更する必要があります
ALTER TABLE "FateTicket" 
    ALTER COLUMN batch_id TYPE INTEGER USING (batch_id::text::integer);

-- 外部キー制約を再作成
ALTER TABLE "FateTicket" 
    ADD CONSTRAINT "FateTicket_batch_id_fkey" 
    FOREIGN KEY (batch_id) REFERENCES "FateBatch"(id);

-- BatchQueueテーブルの外部キー制約を再作成（もし存在する場合）
-- 注意: BatchQueueテーブルのbatch_idカラムの型も変更する必要があります
ALTER TABLE "BatchQueue" 
    ALTER COLUMN batch_id TYPE INTEGER USING (batch_id::text::integer);

ALTER TABLE "BatchQueue" 
    ADD CONSTRAINT "BatchQueue_batch_id_fkey" 
    FOREIGN KEY (batch_id) REFERENCES "FateBatch"(id);

-- コメント追加
COMMENT ON TABLE "FateBatch" IS '運命バッチ - 連番ID使用';
COMMENT ON COLUMN "FateBatch".id IS '運命バッチID（連番）'; 