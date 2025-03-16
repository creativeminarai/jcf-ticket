-- JCF-ticket データベーススキーマ

-- 注意: Userテーブルはsupabaseのauth.usersを使用するため作成不要

-- EventVenue テーブル
CREATE TABLE IF NOT EXISTS "EventVenue" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country VARCHAR NOT NULL,
    prefecture VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    reception_location VARCHAR,
    venue_url VARCHAR,
    venue_phone VARCHAR,
    deleted_at TIMESTAMP
);

-- EventDate テーブル
CREATE TABLE IF NOT EXISTS "EventDate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_date DATE NOT NULL,
    event_time TIME,
    deleted_at TIMESTAMP
);

-- Event テーブル
CREATE TABLE IF NOT EXISTS "Event" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    theme VARCHAR,
    event_venue_id UUID REFERENCES "EventVenue"(id),
    deleted_at TIMESTAMP
);

-- Event_EventDate 中間テーブル (多対多の関係を扱うため)
CREATE TABLE IF NOT EXISTS "Event_EventDate" (
    event_id UUID REFERENCES "Event"(id),
    event_date_id UUID REFERENCES "EventDate"(id),
    PRIMARY KEY (event_id, event_date_id)
);

-- TicketType テーブル
CREATE TABLE IF NOT EXISTS "TicketType" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    ticket_category VARCHAR NOT NULL,
    quantity INTEGER NOT NULL,
    deleted_at TIMESTAMP
);

-- TicketPrice テーブル
CREATE TABLE IF NOT EXISTS "TicketPrice" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_type_id UUID REFERENCES "TicketType"(id),
    price INTEGER NOT NULL,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Shop テーブル
CREATE TABLE IF NOT EXISTS "Shop" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_code VARCHAR,
    shop_name VARCHAR NOT NULL,
    coffee_name VARCHAR,
    greeting TEXT,
    roast_level VARCHAR,
    pr_url VARCHAR,
    destiny_ratio FLOAT,
    ticket_count INTEGER,
    image_url VARCHAR,
    notes TEXT,
    event_id UUID REFERENCES "Event"(id),
    deleted_at TIMESTAMP
);

-- PurchaseHistory テーブル
CREATE TABLE IF NOT EXISTS "PurchaseHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES "Event"(id),
    user_id UUID REFERENCES auth.users(id),
    ticket_type_id UUID REFERENCES "TicketType"(id),
    purchase_date TIMESTAMP NOT NULL,
    quantity INTEGER NOT NULL,
    payment_id VARCHAR,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AllStoreTicket テーブル
CREATE TABLE IF NOT EXISTS "AllStoreTicket" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES "Event"(id),
    user_id UUID REFERENCES auth.users(id),
    shop_id UUID REFERENCES "Shop"(id),
    used_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- AllStoreTicketTransferHistory テーブル
CREATE TABLE IF NOT EXISTS "AllStoreTicketTransferHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    all_store_ticket_id UUID REFERENCES "AllStoreTicket"(id),
    transfer_date TIMESTAMP NOT NULL,
    staff_name VARCHAR,
    deleted_at TIMESTAMP
);

-- Setting テーブル
CREATE TABLE IF NOT EXISTS "Setting" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threshold INTEGER NOT NULL,
    updated_at TIMESTAMP,
    updated_by_id UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP
);

-- FateBatch テーブル
CREATE TABLE IF NOT EXISTS "FateBatch" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_size INTEGER NOT NULL,
    status VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL,
    activated_at TIMESTAMP,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

-- BatchQueue テーブル
CREATE TABLE IF NOT EXISTS "BatchQueue" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_at TIMESTAMP NOT NULL,
    priority VARCHAR NOT NULL,
    status VARCHAR NOT NULL,
    processed_at TIMESTAMP,
    batch_id UUID REFERENCES "FateBatch"(id),
    error_message TEXT,
    deleted_at TIMESTAMP
);

-- FateTicket テーブル
CREATE TABLE IF NOT EXISTS "FateTicket" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES "FateBatch"(id),
    shop_id UUID REFERENCES "Shop"(id),
    event_id UUID REFERENCES "Event"(id),
    fate_position INTEGER,
    status VARCHAR NOT NULL,
    is_drawn BOOLEAN DEFAULT FALSE,
    drawn_at TIMESTAMP,
    drawn_by_id UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMP
);

-- FateTicketTransferHistory テーブル
CREATE TABLE IF NOT EXISTS "FateTicketTransferHistory" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fate_ticket_id UUID REFERENCES "FateTicket"(id),
    transfer_date TIMESTAMP NOT NULL,
    staff_name VARCHAR,
    deleted_at TIMESTAMP
);

-- インデックス作成
-- idx_user_email は不要（auth.usersに既に存在）
CREATE INDEX IF NOT EXISTS idx_event_name ON "Event"(name);
CREATE INDEX IF NOT EXISTS idx_shop_name ON "Shop"(shop_name);
CREATE INDEX IF NOT EXISTS idx_purchase_history_user_id ON "PurchaseHistory"(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_event_id ON "PurchaseHistory"(event_id);
CREATE INDEX IF NOT EXISTS idx_all_store_ticket_user_id ON "AllStoreTicket"(user_id);
CREATE INDEX IF NOT EXISTS idx_all_store_ticket_event_id ON "AllStoreTicket"(event_id);
CREATE INDEX IF NOT EXISTS idx_fate_ticket_batch_id ON "FateTicket"(batch_id);
CREATE INDEX IF NOT EXISTS idx_fate_ticket_shop_id ON "FateTicket"(shop_id);
CREATE INDEX IF NOT EXISTS idx_fate_ticket_event_id ON "FateTicket"(event_id);

-- RLSポリシーの設定

-- PurchaseHistoryのRLS
ALTER TABLE "PurchaseHistory" ENABLE ROW LEVEL SECURITY;

-- 自分の購入履歴のみ閲覧可能にする
CREATE POLICY "ユーザーは自分の購入履歴のみ閲覧可能" 
ON "PurchaseHistory" FOR SELECT 
USING (auth.uid() = user_id);

-- 購入履歴の挿入を許可
CREATE POLICY "購入履歴の挿入を許可"
ON "PurchaseHistory" FOR INSERT
WITH CHECK (true);

-- 自分の購入履歴のみ更新・削除可能にする
CREATE POLICY "ユーザーは自分の購入履歴のみ更新・削除可能" 
ON "PurchaseHistory" FOR UPDATE DELETE
USING (auth.uid() = user_id);

-- AllStoreTicketのRLS
ALTER TABLE "AllStoreTicket" ENABLE ROW LEVEL SECURITY;

-- 自分のチケットのみ閲覧/操作可能にする
CREATE POLICY "ユーザーは自分のチケットのみ閲覧可能" 
ON "AllStoreTicket" FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のチケットのみ操作可能" 
ON "AllStoreTicket" FOR ALL
USING (auth.uid() = user_id);

-- FateTicketのRLS
ALTER TABLE "FateTicket" ENABLE ROW LEVEL SECURITY;

-- 自分の抽選チケットのみ閲覧/操作可能にする
CREATE POLICY "ユーザーは自分の抽選チケットのみ閲覧可能" 
ON "FateTicket" FOR SELECT 
USING (auth.uid() = drawn_by_id);

CREATE POLICY "ユーザーは自分の抽選チケットのみ操作可能" 
ON "FateTicket" FOR ALL
USING (auth.uid() = drawn_by_id);
