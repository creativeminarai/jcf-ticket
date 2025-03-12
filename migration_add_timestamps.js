// migration_add_timestamps.js
// Supabaseのクライアントを初期化して各テーブルにtimestamp列を追加するマイグレーションスクリプト

import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabaseの接続情報を取得
// これらの値は.env.localファイルなどに設定されている必要があります
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 接続情報が不足している場合はエラーを表示
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません。');
  console.error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を.env.localファイルに設定してください。');
  process.exit(1);
}

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// タイムスタンプカラムを追加する関数
async function addTimestampColumns() {
  try {
    console.log('タイムスタンプカラムの追加を開始します...');

    // 対象テーブルの配列
    const tables = [
      'User', 'PurchaseHistory', 'TicketType', 'TicketPrice', 
      'EventVenue', 'AllStoreTicket', 'AllStoreTicketTransferHistory', 
      'Shop', 'FateTicketTransferHistory', 'FateTicket', 'BatchQueue'
    ];

    // FateBatchテーブルはcreated_atはすでにあるのでupdated_atのみ追加
    const tablesWithUpdatedAtOnly = ['FateBatch'];

    // Settingテーブルはupdated_atはすでにあるのでcreated_atのみ追加
    const tablesWithCreatedAtOnly = ['Setting'];

    // 一般的なテーブルの処理
    for (const table of tables) {
      console.log(`${table}テーブルを処理中...`);
      
      // カラム追加のSQL実行
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE "${table}" 
          ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `
      });
      
      if (error) {
        throw new Error(`${table}テーブルの処理中にエラーが発生しました: ${error.message}`);
      }
    }

    // updated_atのみ追加するテーブルの処理
    for (const table of tablesWithUpdatedAtOnly) {
      console.log(`${table}テーブルのupdated_atを処理中...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE "${table}" 
          ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `
      });
      
      if (error) {
        throw new Error(`${table}テーブルの処理中にエラーが発生しました: ${error.message}`);
      }
    }

    // created_atのみ追加するテーブルの処理
    for (const table of tablesWithCreatedAtOnly) {
      console.log(`${table}テーブルのcreated_atを処理中...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE "${table}" 
          ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `
      });
      
      if (error) {
        throw new Error(`${table}テーブルの処理中にエラーが発生しました: ${error.message}`);
      }
    }

    // 自動更新トリガー関数の作成
    console.log('自動更新トリガー関数を作成中...');
    const { error: triggerFuncError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    if (triggerFuncError) {
      throw new Error(`トリガー関数の作成中にエラーが発生しました: ${triggerFuncError.message}`);
    }

    // 各テーブルにトリガーを設定
    const allTables = [...tables, ...tablesWithUpdatedAtOnly, ...tablesWithCreatedAtOnly, 'Event', 'EventDate'];
    
    for (const table of allTables) {
      console.log(`${table}テーブルのトリガーを設定中...`);
      
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql_query: `
          DROP TRIGGER IF EXISTS update_${table}_updated_at ON "${table}";
          CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON "${table}"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `
      });
      
      if (triggerError) {
        throw new Error(`${table}テーブルのトリガー設定中にエラーが発生しました: ${triggerError.message}`);
      }
    }

    console.log('タイムスタンプカラムの追加が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// マイグレーションの実行
addTimestampColumns();
