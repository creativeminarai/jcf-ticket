import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    // イベント会場情報の挿入
    const { data: venue, error: venueError } = await supabase
      .from('EventVenue')
      .insert({
        id: '018e0e38-c23d-7870-92f1-f1e67029f0e0',
        country: '日本',
        prefecture: '滋賀県',
        city: '日野町',
        reception_location: '近江日野商人ふるさと館'
      })
      .select()
      .single();

    if (venueError) throw venueError;
    console.log('会場情報を作成しました:', venue);

    // イベント開催日の挿入
    const { data: dates, error: datesError } = await supabase
      .from('EventDate')
      .insert([
        {
          id: '018e0e38-c23d-7870-92f1-f1e67029f0e1',
          event_date: '2025-03-08',
          event_time: '10:00:00'
        },
        {
          id: '018e0e38-c23d-7870-92f1-f1e67029f0e2',
          event_date: '2025-03-09',
          event_time: '10:00:00'
        }
      ])
      .select();

    if (datesError) throw datesError;
    console.log('開催日情報を作成しました:', dates);

    // イベント情報の挿入
    const { data: event, error: eventError } = await supabase
      .from('Event')
      .insert({
        id: '018e0e38-c23d-7870-92f1-f1e67029f0e3',
        name: 'Japan Coffee Festival 2025 in 滋賀県日野町',
        theme: '850年続く日野祭に華を添える16の曳山',
        event_venue_id: venue.id
      })
      .select()
      .single();

    if (eventError) throw eventError;
    console.log('イベント情報を作成しました:', event);

    // イベントと開催日の紐付け
    const { error: linkError } = await supabase
      .from('Event_EventDate')
      .insert([
        {
          event_id: event.id,
          event_date_id: '018e0e38-c23d-7870-92f1-f1e67029f0e1'
        },
        {
          event_id: event.id,
          event_date_id: '018e0e38-c23d-7870-92f1-f1e67029f0e2'
        }
      ]);

    if (linkError) throw linkError;
    console.log('イベントと開催日の紐付けを作成しました');

    console.log('シードデータの作成が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

main();