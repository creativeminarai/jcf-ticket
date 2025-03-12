// Supabaseスキーマ適用スクリプト
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase接続情報
const supabaseUrl = 'https://tjdueypaamebxodvrwep.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZHVleXBhYW1lYnhvZHZyd2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MjkwNTgsImV4cCI6MjA1NzIwNTA1OH0.KfVqZ-WzYcIlEktRCzdn_QOLnnC0ycz7oT6C23QLXhc';

// Supabaseクライアント初期化
const supabase = createClient(supabaseUrl, supabaseKey);

// SQLファイルの読み込み
const schemaPath = path.join(__dirname, 'schema.sql');
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

async function applySchema() {
  try {
    // スキーマ適用前にuuid-osspエクステンションを有効化
    const { data: extData, error: extError } = await supabase.rpc('extension', {
      command: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });

    if (extError) {
      console.error('Error enabling uuid-ossp extension:', extError);
      
      // 代替方法: 直接SQLクエリでエクステンションを有効化
      const { data: altExtData, error: altExtError } = await supabase.from('_sql').select(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);
      
      if (altExtError) {
        console.error('Error with alternative approach to enable uuid-ossp:', altExtError);
      } else {
        console.log('uuid-ossp extension enabled with alternative approach');
      }
    } else {
      console.log('uuid-ossp extension enabled');
    }

    // スキーマクエリの実行
    // スキーマを適切なサイズのバッチに分割して実行
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      const cleanStatement = statement.trim() + ';';
      console.log('Executing SQL statement:', cleanStatement.substring(0, 100) + '...');
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: cleanStatement });
        
        if (error) {
          console.error('Error executing statement:', error);
          console.error('Statement was:', cleanStatement);
        }
      } catch (stmtError) {
        console.error('Exception executing statement:', stmtError);
        console.error('Statement was:', cleanStatement);
      }
    }
    
    console.log('Schema applied successfully');
  } catch (error) {
    console.error('Error applying schema:', error);
  }
}

// スキーマ適用実行
applySchema();
