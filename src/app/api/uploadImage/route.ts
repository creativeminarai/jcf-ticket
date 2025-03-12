import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Supabase サービスロールクライアントの設定
// 環境変数から URL とサービスロールキーを取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    // イベント名を取得（存在しない場合はデフォルト値）
    const eventName = formData.get('eventName') as string || 'event';
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // ファイル拡張子とMIMEタイプを取得
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type; // ファイルのMIMEタイプ
    
    // MIMEタイプの検証
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルのみアップロード可能です' }, { status: 400 });
    }
    
    // 意味のあるファイル名を生成
    // イベント名から安全なファイル名を生成
    const sanitizedEventName = eventName
      .replace(/[^a-z0-9]/gi, '_') // 英数字以外をアンダースコアに置換
      .toLowerCase()
      .substring(0, 30); // 長すぎる名前を防止
      
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 15);
    const fileName = `event_${sanitizedEventName}_${timestamp}.${fileExt}`;
    console.log(`Uploading file: ${fileName}, MIME type: ${fileType}`);
    
    // バッファに変換
    const buffer = await file.arrayBuffer();
    
    // サービスロールを使用する Supabase クライアントを作成 (RLS をバイパス)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // ストレージにアップロード (サービスロールを使用)
    const { data, error } = await supabaseAdmin.storage
      .from('EventImage')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType // ファイルのMIMEタイプを指定
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: `アップロードエラー: ${error.message}` }, { status: 500 });
    }
    
    // EventImage バケットが存在し、公開設定であることを確認
    try {
      // Supabaseのバケットに関する設定はダッシュボードで行う必要があるため、
      // ここではバケットの確認や設定は行わず、エラーが発生していることをログに記録するのみ
      console.log('Using EventImage bucket with service role credentials');
    } catch (bucketError) {
      console.error('Bucket operation error:', bucketError);
      // エラーが発生しても処理を継続
    }
    
    // 公開URLを取得
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('EventImage')
      .getPublicUrl(fileName);

    console.log('Generated public URL:', publicUrl);

    return NextResponse.json({
      url: publicUrl,
    });
    
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
