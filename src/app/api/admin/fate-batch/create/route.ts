import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { Database } from "@/types/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// リクエストの型定義
type CreateFateBatchRequest = {
  event_id: string;
  event_date_id: string;
  shops: {
    id: string;
    destiny_ratio: number;
  }[];
};

export async function POST(request: Request) {
  try {
    // リクエストボディの取得
    const body: CreateFateBatchRequest = await request.json();
    const { event_id, event_date_id, shops } = body;

    // バリデーション
    if (!event_id || !event_date_id || !shops || shops.length === 0) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています" },
        { status: 400 }
      );
    }

    // Supabaseクライアントの作成
    const supabase = await createSupabaseServerClient();

    // フェーズ1: バッチキュー作成
    console.log("フェーズ1: バッチキュー作成開始");
    const queueId = uuidv4();
    const now = new Date().toISOString();
    
    // 登録するデータをログ出力
    const batchQueueData = {
      id: queueId,
      requested_at: now,
      priority: "normal",
      status: "pending",
      created_at: now,
      updated_at: now
    };
    console.log("バッチキュー登録データ:", JSON.stringify(batchQueueData, null, 2));

    const { error: queueError } = await supabase
      .from("BatchQueue")
      .insert(batchQueueData);

    if (queueError) {
      // エラー詳細をログ出力
      console.error("バッチキュー作成エラー詳細:", JSON.stringify(queueError, null, 2));
      return NextResponse.json(
        { error: `バッチキューの作成に失敗しました: ${queueError.message || queueError.details || JSON.stringify(queueError)}` },
        { status: 500 }
      );
    }
    console.log("バッチキュー作成完了:", queueId);

    // フェーズ2: 参加店舗確認
    console.log("フェーズ2: 参加店舗確認開始");
    // イベントとイベント日付の存在確認
    const { data: eventData, error: eventError } = await supabase
      .from("Event")
      .select("id, name")
      .eq("id", event_id)
      .is("deleted_at", null)
      .single();

    if (eventError || !eventData) {
      console.error("イベント確認エラー:", eventError);
      await updateQueueStatus(supabase, queueId, "error", "イベントが見つかりません");
      return NextResponse.json(
        { error: "指定されたイベントが見つかりません" },
        { status: 404 }
      );
    }

    const { data: eventDateData, error: eventDateError } = await supabase
      .from("EventDate")
      .select("id, date")
      .eq("id", event_date_id)
      .eq("event_id", event_id)
      .is("deleted_at", null)
      .single();

    if (eventDateError || !eventDateData) {
      console.error("イベント日付確認エラー:", eventDateError);
      await updateQueueStatus(supabase, queueId, "error", "イベント日付が見つかりません");
      return NextResponse.json(
        { error: "指定されたイベント日付が見つかりません" },
        { status: 404 }
      );
    }

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
      await updateQueueStatus(supabase, queueId, "error", "出店情報の取得に失敗しました");
      return NextResponse.json(
        { error: "出店情報の取得に失敗しました" },
        { status: 500 }
      );
    }
    
    if (!attendanceData || attendanceData.length === 0) {
      await updateQueueStatus(supabase, queueId, "error", "この日付に登録されている出店者がいません");
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
      await updateQueueStatus(supabase, queueId, "error", "有効な店舗が見つかりません");
      return NextResponse.json(
        { error: "有効な店舗が見つかりません" },
        { status: 404 }
      );
    }
    
    // 有効な店舗の情報を取得
    const { data: validShops, error: shopsError } = await supabase
      .from("Shop")
      .select("id, shop_name")
      .in("id", validShopIds)
      .is("deleted_at", null);

    if (shopsError) {
      console.error("店舗確認エラー:", shopsError);
      await updateQueueStatus(supabase, queueId, "error", "店舗情報の取得に失敗しました");
      return NextResponse.json(
        { error: "店舗情報の取得に失敗しました" },
        { status: 500 }
      );
    }

    if (!validShops || validShops.length === 0) {
      await updateQueueStatus(supabase, queueId, "error", "有効な店舗が見つかりません");
      return NextResponse.json(
        { error: "有効な店舗が見つかりません" },
        { status: 404 }
      );
    }

    // 有効な店舗IDのみをフィルタリング
    const finalValidShopIds = validShops.map(shop => shop.id);
    const validShopsWithRatio = shops.filter(shop => 
      finalValidShopIds.includes(shop.id)
    );

    if (validShopsWithRatio.length === 0) {
      await updateQueueStatus(supabase, queueId, "error", "有効な店舗が見つかりません");
      return NextResponse.json(
        { error: "有効な店舗が見つかりません" },
        { status: 404 }
      );
    }
    console.log("参加店舗確認完了:", validShopsWithRatio.length, "店舗");

    // フェーズ3: バッチ作成
    console.log("フェーズ3: バッチ作成開始");
    // 比重の合計を計算
    const totalRatio = validShopsWithRatio.reduce(
      (sum, shop) => sum + (shop.destiny_ratio || 0),
      0
    );

    if (totalRatio <= 0) {
      await updateQueueStatus(supabase, queueId, "error", "有効な比重が設定されていません");
      return NextResponse.json(
        { error: "有効な比重が設定されていません" },
        { status: 400 }
      );
    }

    // バッチの作成（連番IDの場合）
    const fateBatchData = {
      batch_size: totalRatio,
      status: "pending",
      created_at: now,
      updated_at: now,
      event_id,
      event_date_id
    };
    console.log("バッチ作成データ:", JSON.stringify(fateBatchData, null, 2));

    const { data: batchData, error: batchError } = await supabase
      .from("FateBatch")
      .insert(fateBatchData)
      .select('id')
      .single();

    if (batchError) {
      console.error("バッチ作成エラー:", batchError);
      await updateQueueStatus(supabase, queueId, "error", "バッチの作成に失敗しました");
      return NextResponse.json(
        { error: "バッチの作成に失敗しました" },
        { status: 500 }
      );
    }

    // 生成されたバッチIDを取得
    const batchId = batchData.id;
    console.log("バッチ作成完了:", batchId);

    // キュー情報の更新
    await updateQueueStatus(
      supabase,
      queueId,
      "processing",
      null,
      batchId,
      now
    );

    // フェーズ4: チケット生成
    console.log("フェーズ4: チケット生成開始");
    const tickets = [];

    // 店舗ごとのチケットを生成
    for (const shop of validShopsWithRatio) {
      const shopRatio = shop.destiny_ratio || 0;
      if (shopRatio <= 0) continue;

      // 各店舗の比重に応じてチケットを生成
      for (let i = 0; i < shopRatio; i++) {
        tickets.push({
          id: uuidv4(),
          batch_id: batchId,
          shop_id: shop.id,
          event_id,
          event_date_id,
          status: "pending",
          is_drawn: false,
          created_at: now,
          updated_at: now
        });
      }
    }

    console.log(`チケット生成: ${tickets.length}枚のチケットを作成します`);
    
    try {
      // RLSをバイパスするためにサービスロールを使用
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      // サービスロールを使用してチケットを挿入
      const { error: ticketsError } = await supabaseAdmin
        .from("FateTicket")
        .insert(tickets);
        
      if (ticketsError) {
        console.error("チケット生成エラー:", ticketsError);
        await updateQueueStatus(supabase, queueId, "error", "チケットの生成に失敗しました");
        return NextResponse.json(
          { error: "チケットの生成に失敗しました" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("チケット生成エラー:", error);
      await updateQueueStatus(supabase, queueId, "error", "チケットの生成に失敗しました");
      return NextResponse.json(
        { error: "チケットの生成に失敗しました" },
        { status: 500 }
      );
    }
    
    console.log("チケット生成完了:", tickets.length, "枚");

    // フェーズ5: バッチ有効化
    console.log("フェーズ5: バッチ有効化開始");
    // チケットをシャッフルして位置を設定（同じ店舗が隣り合わないように）
    const shuffledPositions = arrangeTicketsWithoutAdjacentShops(tickets);
    
    try {
      // RLSをバイパスするためにサービスロールを使用
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      // チケットの位置とステータスを更新（一括更新に最適化）
      const ticketUpdates = [];
      for (let i = 0; i < tickets.length; i++) {
        ticketUpdates.push({
          id: tickets[i].id,
          fate_position: shuffledPositions[i] + 1, // 1-indexed
          status: "active",
          updated_at: now
        });
      }
      
      console.log(`${ticketUpdates.length}枚のチケットを一括更新します`);
      
      // upsertを使用して一括更新
      const { error: updateError } = await supabaseAdmin
        .from("FateTicket")
        .upsert(ticketUpdates, { onConflict: 'id' });

      if (updateError) {
        console.error("チケット更新エラー:", updateError);
        await updateQueueStatus(supabase, queueId, "error", "チケットの更新に失敗しました");
        return NextResponse.json(
          { error: "チケットの更新に失敗しました" },
          { status: 500 }
        );
      }
      
      console.log("チケット更新完了");

      // バッチのステータスを更新
      const { error: batchUpdateError } = await supabaseAdmin
        .from("FateBatch")
        .update({
          status: "active",
          activated_at: now,
          updated_at: now
        })
        .eq("id", batchId);

      if (batchUpdateError) {
        console.error("バッチ更新エラー:", batchUpdateError);
        await updateQueueStatus(supabase, queueId, "error", "バッチの更新に失敗しました");
        return NextResponse.json(
          { error: "バッチの更新に失敗しました" },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("バッチ有効化エラー:", error);
      await updateQueueStatus(supabase, queueId, "error", "バッチの有効化に失敗しました");
      return NextResponse.json(
        { error: "バッチの有効化に失敗しました" },
        { status: 500 }
      );
    }
    
    console.log("バッチ有効化完了");

    // フェーズ6: キュー完了
    console.log("フェーズ6: キュー完了");
    await updateQueueStatus(supabase, queueId, "completed", null, batchId, now);

    return NextResponse.json({
      success: true,
      message: "運命チケットの生成が完了しました",
      data: {
        queue_id: queueId,
        batch_id: batchId,
        ticket_count: tickets.length,
        event_id,
        event_date_id
      }
    });
  } catch (error) {
    console.error("運命チケット生成エラー:", error);
    return NextResponse.json(
      { error: "運命チケットの生成中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// キューのステータスを更新する関数
async function updateQueueStatus(
  supabase: SupabaseClient<Database>,
  queueId: string,
  status: string,
  errorMessage: string | null = null,
  batchId: number | null = null,
  processedAt: string | null = null
) {
  try {
    // RLSをバイパスするためにサービスロールを使用
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const now = new Date().toISOString();
    const updateData: any = {
      status,
      updated_at: now
    };

    if (errorMessage) updateData.error_message = errorMessage;
    if (batchId) updateData.batch_id = batchId;
    if (processedAt) updateData.processed_at = processedAt;
    
    // completedステータスの場合、completed_atフィールドを設定
    if (status === "completed") {
      updateData.completed_at = now;
    }

    console.log("キューステータス更新:", {
      queueId,
      status,
      batchId,
      updateData
    });

    const { error } = await supabaseAdmin
      .from("BatchQueue")
      .update(updateData)
      .eq("id", queueId);
      
    if (error) {
      console.error("キューステータス更新エラー:", error);
    }
  } catch (error) {
    console.error("キューステータス更新中にエラーが発生しました:", error);
  }
}

// 配列をシャッフルする関数
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 同じ店舗が隣り合わないようにポジションを決定する関数
function arrangeTicketsWithoutAdjacentShops(tickets: any[]): number[] {
  // 店舗IDごとにチケットのインデックスをグループ化
  const shopGroups: { [shopId: string]: number[] } = {};
  
  tickets.forEach((ticket, index) => {
    if (!shopGroups[ticket.shop_id]) {
      shopGroups[ticket.shop_id] = [];
    }
    shopGroups[ticket.shop_id].push(index);
  });
  
  // 各店舗のチケットをシャッフル
  Object.keys(shopGroups).forEach(shopId => {
    shopGroups[shopId] = shuffleArray(shopGroups[shopId]);
  });
  
  // 結果の配列を初期化
  const result: number[] = [];
  
  // 店舗IDの配列を作成
  const shopIds = Object.keys(shopGroups);
  
  // 各店舗からチケットを1枚ずつ取り出して配置していく
  let allTicketsPlaced = false;
  let lastShopId = ""; // 最後に配置した店舗ID
  
  while (!allTicketsPlaced) {
    allTicketsPlaced = true;
    
    // 使用可能な店舗（前回と異なる店舗かつチケットが残っている）を探す
    const availableShops = shopIds.filter(shopId => 
      shopId !== lastShopId && shopGroups[shopId].length > 0
    );
    
    if (availableShops.length > 0) {
      // ランダムに店舗を選択
      const randomShopIndex = Math.floor(Math.random() * availableShops.length);
      const selectedShopId = availableShops[randomShopIndex];
      
      // 選択した店舗からチケットを1枚取り出して配置
      const ticketIndex = shopGroups[selectedShopId].pop()!;
      result.push(ticketIndex);
      
      // 最後に配置した店舗IDを更新
      lastShopId = selectedShopId;
      
      // まだチケットが残っている店舗があるか確認
      allTicketsPlaced = !shopIds.some(shopId => shopGroups[shopId].length > 0);
    } else if (shopIds.some(shopId => shopGroups[shopId].length > 0)) {
      // 使用可能な店舗がないが、まだチケットが残っている場合
      // 前回と同じ店舗からチケットを取り出す必要がある
      const remainingShops = shopIds.filter(shopId => shopGroups[shopId].length > 0);
      if (remainingShops.length > 0) {
        const selectedShopId = remainingShops[0];
        const ticketIndex = shopGroups[selectedShopId].pop()!;
        result.push(ticketIndex);
        lastShopId = selectedShopId;
        allTicketsPlaced = !shopIds.some(shopId => shopGroups[shopId].length > 0);
      }
    }
  }
  
  // 最終チェック - すべてのチケットが配置されているか確認
  if (result.length !== tickets.length) {
    console.warn(`チケット配置に問題があります。期待: ${tickets.length}枚, 実際: ${result.length}枚`);
    return shuffleArray([...Array(tickets.length).keys()]);
  }
  
  return result;
} 