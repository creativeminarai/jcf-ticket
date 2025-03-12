import { Event } from '@/types/ticket';

interface EventInfoProps {
  event: Event;
}

export function EventInfo({ event }: EventInfoProps) {
  // イベント日時の表示形式を整形 - より簡潔に
  let formattedDates = '日時未定';
  
  if (event.EventDate && event.EventDate.length > 0) {
    // 日付でグループ化
    const dateGroups: Record<string, string[]> = {};
    
    event.EventDate.forEach(dateObj => {
      if (!dateGroups[dateObj.date]) {
        dateGroups[dateObj.date] = [];
      }
      dateGroups[dateObj.date].push(dateObj.time);
    });
    
    // 日付ごとに整形
    formattedDates = Object.entries(dateGroups).map(([dateStr, times]) => {
      const date = new Date(dateStr);
      
      // 月と日のみ表示
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // 曜日を取得
      const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
      
      // 「3月1日(土)」の形式に整形
      const formattedDate = `${month}月${day}日(${weekday})`;
      
      return `${formattedDate} ${times.join('、')}`;
    }).join('\n');
  }

  // 開催場所情報を整形
  const venueInfo = [event.prefecture, event.city, event.reception_location]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="overflow-hidden p-6 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] bg-gray-50">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {event.name}
      </h2>
      {event.theme && (
        <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
          テーマ「{event.theme}」
        </p>
      )}
      <div className="text-gray-600 space-y-1">
        <p className="text-sm"><span className="font-medium">開催日時:</span> {formattedDates.split('\n').map((date, index) => (
          <span key={index} className="block ml-2">{date}</span>
        ))}</p>
        {venueInfo && <p className="text-sm"><span className="font-medium">開催場所:</span> {venueInfo}</p>}
      </div>
    </section>
  );
}
