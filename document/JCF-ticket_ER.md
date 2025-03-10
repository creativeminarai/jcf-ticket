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
    
    TicketType ||--o{ PurchaseHistory : "分類される"
    TicketType ||--o{ TicketPrice : "価格設定を持つ"
    
    AllStoreTicket ||--|| AllStoreTicketTransferHistory : "移行される"
    AllStoreTicket }o--|| Shop : "使用される"
    
    Shop ||--o{ FateTicket : "くじ対象となる"
    FateBatch ||--o{ FateTicket : "含む"
    User ||--o{ FateTicket : "抽選する"
    FateTicket ||--|| FateTicketTransferHistory : "移行される"
    Setting ||--o{ FateBatch : "管理する"
    BatchQueue ||--|| FateBatch : "生成する"
    
    User {
        uuid id PK "ID"
        string username "ユーザー名"
        timestamp deleted_at "削除日"
        timestamp last_login "最終ログイン"
        string email "メールアドレス"
    }
    
    PurchaseHistory {
        uuid id PK "ID"
        uuid event_id FK "イベントID"
        uuid user_id FK "ユーザーID"
        uuid ticket_type_id FK "チケット種別ID"
        timestamp deleted_at "削除日"
        timestamp purchase_date "購入日"
        integer quantity "購入数"
        string payment_id "購入ID"
    }
    
    TicketType {
        uuid id PK "ID"
        string title "チケットタイトル"
        string description "説明"
        enum ticket_category "カテゴリ(当日券/前売り券/追加券等)"
        integer quantity "枚数(セット数)"
        timestamp deleted_at "削除日"
    }
    
    TicketPrice {
        uuid id PK "ID"
        uuid ticket_type_id FK "チケット種別ID"
        integer price "価格"
        timestamp valid_from "有効開始日時"
        timestamp valid_until "有効終了日時"
        timestamp deleted_at "削除日"
    }
    
    Event {
        uuid id PK "ID"
        string name "イベント名"
        string theme "テーマ"
        timestamp deleted_at "削除日"
        uuid event_date_id FK "開催日時ID"
        uuid event_venue_id FK "開催地ID"
    }
    
    EventDate {
        uuid id PK "ID"
        timestamp deleted_at "削除日"
        date event_date "開催日"
        time event_time "開催時間"
    }
    
    EventVenue {
        uuid id PK "ID"
        timestamp deleted_at "削除日"
        string country "開催国"
        string prefecture "開催都道府県"
        string city "開催市区町村"
        string reception_location "受付場所"
        string venue_url "開催場所URL"
        string venue_phone "開催場所電話番号"
    }
    
    AllStoreTicket {
        uuid id PK "ID"
        uuid event_id FK "イベントID"
        uuid user_id FK "ユーザーID"
        uuid shop_id FK "使用店舗ID"
        timestamp used_at "使用日時"
        timestamp deleted_at "削除日"
    }
    
    AllStoreTicketTransferHistory {
        uuid id PK "ID"
        uuid all_store_ticket_id FK "全店舗チケットID"
        timestamp transfer_date "移行日時"
        string staff_name "担当者"
        timestamp deleted_at "削除日"
    }
    
    Shop {
        uuid id PK "ID"
        string shop_number "店舗番号"
        string shop_name "出店者名"
        string coffee_name "出品コーヒー名"
        text greeting "ご挨拶"
        string roast_level "焙煎度"
        string pr_url "広報URL"
        float destiny_ratio "運命の比重"
        integer ticket_count "チケット枚数"
        string image_url "画像URL"
        text notes "備考"
        timestamp deleted_at "削除日"
    }
    
    FateTicketTransferHistory {
        uuid id PK "ID"
        uuid fate_ticket_id FK "運命チケットID"
        timestamp transfer_date "移行日時"
        string staff_name "担当者"
        timestamp deleted_at "削除日"
    }
    
    FateBatch {
        uuid id PK "バッチID"
        integer batch_size "バッチサイズ"
        enum status "ステータス"
        timestamp created_at "作成日時"
        timestamp activated_at "有効化日時"
        timestamp completed_at "完了日時"
        timestamp deleted_at "削除日"
    }
    
    FateTicket {
        uuid id PK "運命チケットID"
        uuid batch_id FK "バッチID"
        uuid shop_id FK "出店者ID"
        uuid event_id FK "イベントID"
        integer fate_position "運命チケット位置"
        enum status "状態"
        boolean is_drawn "抽選済"
        timestamp drawn_at "抽選日時"
        uuid drawn_by_id FK "抽選者ID"
        timestamp deleted_at "削除日"
    }
    
    Setting {
        uuid id PK "設定ID"
        integer threshold "残り閾値"
        timestamp updated_at "更新日時"
        uuid updated_by_id FK "更新者ID"
        timestamp deleted_at "削除日"
    }
    
    BatchQueue {
        uuid id PK "キューID"
        timestamp requested_at "リクエスト日時"
        enum priority "優先度"
        enum status "状態"
        timestamp processed_at "処理日時"
        uuid batch_id FK "バッチID"
        text error_message "エラーメッセージ"
        timestamp deleted_at "削除日"
    }
```