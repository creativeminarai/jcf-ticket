import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 特定のイベントの出店者の出店日情報を取得
export async function GET(request: Request) {
  const url = new URL(request.url);
  const event_id = url.searchParams.get('event_id');
  
  if (!event_id) {
    return NextResponse.json({ error: 'event_idは必須です' }, { status: 400 });
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // イベント日付を取得
    const { data: eventDates, error: eventDatesError } = await supabase
      .from('EventDate')
      .select('*')
      .eq('event_id', event_id)
      .is('deleted_at', null);
      
    if (eventDatesError) {
      return NextResponse.json({ error: eventDatesError.message }, { status: 500 });
    }
    
    // イベントに関連する店舗を取得
    const { data: shops, error: shopsError } = await supabase
      .from('Shop')
      .select('*')
      .eq('event_id', event_id);
      
    if (shopsError) {
      return NextResponse.json({ error: shopsError.message }, { status: 500 });
    }
    
    // 出店日情報を取得
    const shopIds = shops.map(shop => shop.id);
    const eventDateIds = eventDates.map(date => date.id);
    
    let attendances = [];
    if (shopIds.length > 0 && eventDateIds.length > 0) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('ShopAttendance')
        .select('*')
        .in('shop_id', shopIds)
        .in('event_date_id', eventDateIds)
        .is('deleted_at', null);
        
      if (attendanceError) {
        return NextResponse.json({ error: attendanceError.message }, { status: 500 });
      }
      
      attendances = attendanceData;
    }
    
    return NextResponse.json({ eventDates, shops, attendances });
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    return NextResponse.json({ error: '出店日情報の取得に失敗しました' }, { status: 500 });
  }
}

// 出店日情報の一括更新（追加・削除）
export async function POST(request: Request) {
  try {
    const { shopId, eventDateId, isAttending } = await request.json();
    
    if (!shopId || !eventDateId) {
      return NextResponse.json({ error: 'shop_idとevent_date_idは必須です' }, { status: 400 });
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // 既存の出店日情報を取得（論理削除されたものも含む）
    const { data: existingAttendances, error: fetchError } = await supabase
      .from('ShopAttendance')
      .select('*')
      .eq('shop_id', shopId)
      .eq('event_date_id', eventDateId);
      
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    // アクティブな出席データと削除済みの出席データを分ける
    const activeAttendance = existingAttendances?.find(a => a.deleted_at === null);
    const deletedAttendance = existingAttendances?.find(a => a.deleted_at !== null);
    
    if (isAttending) {
      // 出席に設定（チェックつける）
      if (activeAttendance) {
        // 既にアクティブな出席データがある場合は何もしない
        return NextResponse.json({ success: true, attendance: activeAttendance });
      } else if (deletedAttendance) {
        // 論理削除された出席データがある場合は復活させる
        const { data, error: restoreError } = await supabase
          .from('ShopAttendance')
          .update({
            deleted_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletedAttendance.id)
          .select()
          .single();
          
        if (restoreError) {
          return NextResponse.json({ error: restoreError.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, attendance: data });
      } else {
        // 出席データがない場合は新規作成
        const { data, error: insertError } = await supabase
          .from('ShopAttendance')
          .insert({
            shop_id: shopId,
            event_date_id: eventDateId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, attendance: data });
      }
    } else {
      // 欠席に設定（チェック外す）
      if (activeAttendance) {
        // アクティブな出席データがある場合は論理削除
        const { data, error: deleteError } = await supabase
          .from('ShopAttendance')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', activeAttendance.id)
          .select()
          .single();
          
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
        
        return NextResponse.json({ success: true, attendance: data });
      } else {
        // アクティブな出席データがない場合は何もしない
        return NextResponse.json({ success: true, message: '既に欠席状態です' });
      }
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: '出店日情報の更新に失敗しました' }, { status: 500 });
  }
}
