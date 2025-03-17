# FateTicketテーブルのER図更新

## 変更内容
FateTicketテーブルに`event_date_id`カラムを追加し、EventDateテーブルとの関連を追加します。

## 更新後のER図（mermaid形式）

```mermaid
erDiagram
    User ||--o{ PurchaseHistory : "購入する"
    User ||--o{ AllStoreTicket : "保有する"
    User ||--o{ FateTicket : "抽選する"
    
    Event ||--o{ PurchaseHistory : "含まれる"
    Event ||--o{ EventDate : "開催される"
    Event ||--|| EventVenue : "開催される"
    Event ||--o{ AllStoreTicket : "発行される"
    Event ||--o{ Shop : "出店する"
    Event ||--o{ FateTicket : "発行される"
    
    EventDate ||--o{ FateTicket : "くじを持つ" %% 新しい関連
    
    TicketType ||--o{ PurchaseHistory : "分類される"
    TicketType ||--o{ TicketPrice : "価格設定を持つ"
    
    AllStoreTicket ||--|| AllStoreTicketTransferHistory : "移行される"
    AllStoreTicket }o--|| Shop : "使用される"
    
    Shop ||--o{ FateTicket : "くじ対象となる"
    Shop ||--o{ ShopAttendance : "出店日を持つ"
    EventDate ||--o{ ShopAttendance : "出店される"
    
    FateBatch ||--o{ FateTicket : "含む"
    User ||--o{ FateTicket : "抽選する"
    FateTicket ||--|| FateTicketTransferHistory : "移行される"
    Setting ||--o{ FateBatch : "管理する"
    BatchQueue ||--|| FateBatch : "生成する"
    
    %% 省略: 各テーブルの属性定義
    
    FateTicket {
        uuid id PK "運命チケットID"
        uuid batch_id FK "バッチID"
        uuid shop_id FK "出店者ID"
        uuid event_id FK "イベントID"
        uuid event_date_id FK "イベント日ID" %% 新しいカラム
        integer fate_position "運命チケット位置"
        enum status "状態"
        boolean is_drawn "抽選済"
        timestamp drawn_at "抽選日時"
        uuid drawn_by_id FK "抽選者ID"
        timestamp deleted_at "削除日"
        timestamp created_at "作成日時"
        timestamp updated_at "更新日時"
    }
```

## 変更の目的
特定のイベント日に紐づいたくじ引きを管理できるようにするため、FateTicketテーブルにevent_date_idカラムを追加しました。これにより、イベントの各開催日ごとに異なるくじ引きを管理することが可能になります。

## 実装上の注意点
1. 既存のFateTicketレコードには、event_date_idがNULLとなります
2. 新しいくじ引きバッチを生成する際は、特定のイベント日を指定する必要があります
3. くじ引き処理のロジックも、イベント日を考慮したものに更新する必要があります 