import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Next.js 15でcookies()関数が非同期になったため、nodejsランタイムを使用
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const shopName = formData.get('shopName') as string || 'shop';
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // ファイル拡張子とMIMEタイプを取得
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type;
    
    // MIMEタイプの検証
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: '画像ファイルのみアップロード可能です' },
        { status: 400 }
      );
    }
    
    // 意味のあるファイル名を生成
    const sanitizedShopName = shopName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 30);
      
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').substring(0, 15);
    const fileName = `shop_${sanitizedShopName}_${timestamp}.${fileExt}`;
    
    // バッファに変換
    const buffer = await file.arrayBuffer();
    
    // Supabaseクライアントを作成
    const supabase = await createClient();
    
    // ShopImageバケット（public）にアップロード
    const { data, error } = await supabase.storage
      .from('ShopImage')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: `アップロードエラー: ${error.message}` },
        { status: 500 }
      );
    }
    
    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('ShopImage')
      .getPublicUrl(fileName);
    
    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}