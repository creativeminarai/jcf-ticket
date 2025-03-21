// @ts-check
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * Supabase接続テスト
 * 
 * このファイルはSupabaseへの接続をテストするためのものです。
 * 実行方法: `node src/__tests__/supabase-connection.test.js`
 */

// .env.localファイルから環境変数を読み込む
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
    
    console.log('環境変数を.env.localから読み込みました');
  } catch (err) {
    console.error('.env.localファイルの読み込みに失敗しました:', err.message);
  }
}

// 環境変数を読み込む
loadEnv();

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('エラー: Supabase環境変数が設定されていません');
  process.exit(1);
}

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('Supabase接続テストを開始します...');
  
  try {
    // Eventテーブルからデータを取得してみる
    const { data, error } = await supabase
      .from('Event')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase接続エラー:', error.message);
      return false;
    }
    
    console.log('Supabase接続成功！');
    console.log('取得したデータ:', data);
    return true;
  } catch (err) {
    console.error('予期せぬエラーが発生しました:', err);
    return false;
  }
}

// テストの実行
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('テスト成功: Supabaseに正常に接続できました');
      process.exit(0);
    } else {
      console.error('テスト失敗: Supabaseに接続できませんでした');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('テスト実行中にエラーが発生しました:', err);
    process.exit(1);
  });
