// SQLスクリプトをSupabaseに適用するためのスクリプト
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQLファイルの読み込み
const sqlContent = fs.readFileSync('./schema_add.sql', 'utf8');

async function applySchema() {
  try {
    console.log('SQLスクリプトを実行中...');
    
    // SQLを適用
    const { data, error } = await supabase.rpc('exec_sql', {
      query: sqlContent
    });
    
    if (error) {
      console.error('SQLの実行中にエラーが発生しました:', error);
      return;
    }
    
    console.log('SQLが正常に適用されました');
    console.log('データ:', data);
    
    // テストのためにeventテーブルのデータを取得
    const { data: events, error: eventsError } = await supabase
      .from('Event')
      .select('*');
    
    if (eventsError) {
      console.error('イベントデータの取得中にエラーが発生しました:', eventsError);
      return;
    }
    
    console.log('イベント一覧:');
    console.table(events);
    
  } catch (error) {
    console.error('予期しないエラーが発生しました:', error);
  }
}

applySchema();
