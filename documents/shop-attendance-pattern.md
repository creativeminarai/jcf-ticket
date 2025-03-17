# ShopAttendanceテーブルを介した店舗情報の取得パターン

## 概要

このドキュメントでは、イベント日付に紐づく店舗情報を取得する際の正しいパターンについて説明します。JCFチケットシステムでは、`Shop`テーブルと`EventDate`テーブルの間に`ShopAttendance`テーブルが存在し、多対多の関係を表現しています。

## データベース構造

### 関連テーブル

1. **Event**: イベント情報
   - `id`: イベントID
   - `name`: イベント名
   - その他のイベント情報

2. **EventDate**: イベントの開催日
   - `id`: イベント日付ID
   - `event_id`: イベントID（Eventテーブルへの外部キー）
   - `date`: 開催日
   - その他の開催日情報

3. **Shop**: 店舗情報
   - `id`: 店舗ID
   - `shop_name`: 店舗名（注意: `name`フィールドは存在しません）
   - `shop_code`: 店舗コード
   - その他の店舗情報

4. **ShopAttendance**: 店舗の出店情報（中間テーブル）
   - `id`: 出店情報ID
   - `shop_id`: 店舗ID（Shopテーブルへの外部キー）
   - `event_date_id`: イベント日付ID（EventDateテーブルへの外部キー）
   - その他の出店情報

### 重要なポイント

- `Shop`テーブルには`event_date_id`フィールドは存在しません
- 特定のイベント日に出店している店舗を取得するには、必ず`ShopAttendance`テーブルを介して取得する必要があります
- `Shop`テーブルには`name`フィールドは存在せず、店舗名は`shop_name`フィールドに格納されています

## 正しい実装パターン

### フロントエンド（クライアントサイド）での実装

```typescript
// 特定のイベント日付に出店している店舗情報を取得する
const fetchShops = async (dateId: string) => {
  try {
    setIsLoadingShops(true);
    
    // 1. まず出店情報を取得
    const { data: attendanceData, error: attendanceError } = await supabase
      .from("ShopAttendance")
      .select("id, shop_id")
      .eq("event_date_id", dateId)
      .is("deleted_at", null);

    if (attendanceError) {
      throw attendanceError;
    }

    if (!attendanceData || attendanceData.length === 0) {
      setShops([]);
      return;
    }

    // 2. 取得した店舗IDのリストを作成
    const shopIds = attendanceData.map(attendance => attendance.shop_id);

    // 3. 店舗情報を別クエリで取得
    const { data: shopsData, error: shopsError } = await supabase
      .from("Shop")
      .select("*")
      .in("id", shopIds)
      .is("deleted_at", null);

    if (shopsError) {
      throw shopsError;
    }

    // 4. 出店者データと店舗データを結合
    const formattedShops = shopsData.map(shop => {
      const attendance = attendanceData.find(a => a.shop_id === shop.id);
      
      return {
        ...shop,
        // 必要に応じて追加のプロパティを設定
        destiny_ratio: shop.destiny_ratio || 0
      };
    });
    
    // 5. 必要に応じてソート
    formattedShops.sort((a, b) => {
      const numA = a.shop_code ? parseInt(a.shop_code.slice(-4), 10) || 0 : 0;
      const numB = b.shop_code ? parseInt(b.shop_code.slice(-4), 10) || 0 : 0;
      return numA - numB;
    });
    
    setShops(formattedShops);
  } catch (error) {
    console.error("店舗情報取得エラー:", error);
    // エラー処理
  } finally {
    setIsLoadingShops(false);
  }
};
```

### バックエンド（APIエンドポイント）での実装

```typescript
// 特定のイベント日付に出店している店舗を確認する
// 参加店舗の確認（リクエストで送られてきた店舗IDが有効かチェック）
const shopIds = shops.map(shop => shop.id);

// まずShopAttendanceテーブルで、指定されたイベント日付に参加している店舗を確認
const { data: attendanceData, error: attendanceError } = await supabase
  .from("ShopAttendance")
  .select("shop_id")
  .eq("event_date_id", event_date_id)
  .is("deleted_at", null);
  
if (attendanceError) {
  console.error("出店情報確認エラー:", attendanceError);
  // エラー処理
  return NextResponse.json(
    { error: "出店情報の取得に失敗しました" },
    { status: 500 }
  );
}

if (!attendanceData || attendanceData.length === 0) {
  // エラー処理
  return NextResponse.json(
    { error: "この日付に登録されている出店者がいません" },
    { status: 404 }
  );
}

// 出店情報から店舗IDのリストを作成
const attendingShopIds = attendanceData.map(attendance => attendance.shop_id);

// 送信された店舗IDが実際に出店している店舗かチェック
const validShopIds = shopIds.filter(id => attendingShopIds.includes(id));

if (validShopIds.length === 0) {
  // エラー処理
  return NextResponse.json(
    { error: "有効な店舗が見つかりません" },
    { status: 404 }
  );
}

// 有効な店舗の情報を取得
const { data: validShops, error: shopsError } = await supabase
  .from("Shop")
  .select("id, shop_name") // 注意: nameではなくshop_nameを使用
  .in("id", validShopIds)
  .is("deleted_at", null);

// 以降の処理...
```

## よくある間違い

### ❌ 間違った実装パターン

```typescript
// 間違い1: Shopテーブルから直接event_date_idでフィルタリングしようとしている
const { data, error } = await supabase
  .from("Shop")
  .select("*")
  .eq("event_date_id", dateId)  // ❌ Shopテーブルにはevent_date_idフィールドが存在しない
  .is("deleted_at", null);

// 間違い2: Shopテーブルのnameフィールドを参照しようとしている
const { data, error } = await supabase
  .from("Shop")
  .select("id, name, shop_name")  // ❌ Shopテーブルにはnameフィールドは存在しない
  .in("id", shopIds)
  .is("deleted_at", null);
```

### ✅ 正しい実装パターン

```typescript
// 正しい実装1: ShopAttendanceテーブルを介して店舗情報を取得
// 1. まず出店情報を取得
const { data: attendanceData, error: attendanceError } = await supabase
  .from("ShopAttendance")
  .select("shop_id")
  .eq("event_date_id", dateId)
  .is("deleted_at", null);

// 2. 取得した店舗IDを使用して店舗情報を取得
const shopIds = attendanceData.map(attendance => attendance.shop_id);
const { data: shopsData, error: shopsError } = await supabase
  .from("Shop")
  .select("*")
  .in("id", shopIds)
  .is("deleted_at", null);

// 正しい実装2: 店舗名を取得する場合はshop_nameフィールドを使用
const { data: shopsData, error: shopsError } = await supabase
  .from("Shop")
  .select("id, shop_name")  // ✅ 正しいフィールド名を使用
  .in("id", shopIds)
  .is("deleted_at", null);
```

## 実装時の注意点

1. **必ず`ShopAttendance`テーブルを介して店舗情報を取得する**
   - `Shop`テーブルには`event_date_id`フィールドは存在しません
   - 直接`Shop`テーブルから特定のイベント日の店舗を取得することはできません

2. **2段階のクエリが必要**
   - 最初に`ShopAttendance`テーブルから該当するイベント日の店舗IDを取得
   - 次に取得した店舗IDを使って`Shop`テーブルから店舗情報を取得

3. **データの結合処理**
   - 必要に応じて`ShopAttendance`テーブルと`Shop`テーブルのデータを結合
   - 例: 出店情報に特有のデータ（ブース番号など）と店舗情報を組み合わせる

4. **エラーハンドリング**
   - 各ステップでのエラーを適切に処理する
   - 特に出店情報が存在しない場合のエラーハンドリングが重要

5. **正しいフィールド名を使用する**
   - `Shop`テーブルの店舗名は`shop_name`フィールドに格納されています
   - `name`フィールドは存在しないため、`shop_name`を使用してください
   - 間違ったフィールド名を使用すると「column Shop.name does not exist」などのエラーが発生します

## まとめ

JCFチケットシステムでは、イベント日付に紐づく店舗情報を取得する際には、必ず`ShopAttendance`テーブルを介して取得する必要があります。また、店舗名を参照する際は`name`ではなく`shop_name`フィールドを使用してください。これらの実装パターンを守ることで、データの整合性を保ち、正確な店舗情報を取得することができます。 