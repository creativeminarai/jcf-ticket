-- 全ての認証済みユーザーがFateTicketデータを読み取れるシンプルなポリシー
CREATE POLICY "認証済みユーザーは全てのチケットを読み取れる" 
ON "FateTicket"
FOR SELECT
TO authenticated
USING (true);

-- ここまでは実行済み


-- 以下、まだ実行できていない

-- または、特定の条件に基づくポリシー（例：batch_idを介してevent_idを使用）
CREATE POLICY "ユーザーは特定のイベントのチケットを読み取れる" 
ON "FateTicket"
FOR SELECT
TO authenticated
USING (
  batch_id IN (
    SELECT id FROM "FateBatch" 
    WHERE event_id IN (
      SELECT id FROM "Event" WHERE event_owner = auth.uid()
    )
  )
);