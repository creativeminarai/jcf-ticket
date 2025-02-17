import { Event } from '@/types/ticket';

interface EventInfoProps {
  event: Event;
}

export function EventInfo({ event }: EventInfoProps) {
  return (
    <section className="overflow-hidden p-6 shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] bg-gray-50">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {event.title}
      </h2>
      <p className="text-sm text-gray-600 mb-3 border-b border-gray-200 pb-3">
        テーマ「{event.theme}」
      </p>
      <p className="text-gray-600">開催日: {event.date}</p>
    </section>
  );
}
