import Image from 'next/image';
import { HistoryGroup } from '@/types/ticket';

interface CoffeeHistoryProps {
  histories: HistoryGroup[];
}

export function CoffeeHistory({ histories }: CoffeeHistoryProps) {
  return (
    <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        コーヒーの履歴
      </h2>
      <div className="space-y-8">
        {histories.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="font-bold text-gray-900 mb-3">
              {new Date(group.date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              （{new Date(group.date).toLocaleDateString('ja-JP', { weekday: 'narrow' })}）
            </h3>
            <div className="space-y-4">
              {group.histories.map((history, historyIndex) => (
                <div key={historyIndex} className="bg-gray-50 rounded-lg p-4 relative">
                  <div className="absolute top-4 right-4">
                    <span className="text-sm text-gray-500">{history.exchangeDate}</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={history.imageUrl}
                        alt={history.storeName}
                        fill
                        className="object-cover rounded-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="border-b border-gray-200 pb-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{history.storeName}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            出品コーヒー
                          </span>
                          <span className="text-gray-700">「{history.coffeeName}」</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            チケット枚数
                          </span>
                          <span className="text-gray-700">{history.ticketCount}枚</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
