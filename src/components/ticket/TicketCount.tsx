import Image from "next/image";

type TicketCountProps = {
  count?: number;
  eventId?: string;
  onPurchase?: () => void;
};

export function TicketCount({ count = 2, eventId, onPurchase }: TicketCountProps) {
  return (
    <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        チケット枚数
      </h2>
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-lg border-4 border-indigo-100 bg-white flex justify-center items-center">
          <Image 
            src="/マグカップロゴ.png" 
            alt="チケット"
            width={80}
            height={80}
            style={{ objectFit: 'contain' }}
            className="hover:scale-105 transition-transform"
          />
        </div>
        <div className="mt-4 text-center">
          <span className="text-2xl font-bold text-indigo-700">×{count}枚</span>
        </div>
      </div>
      <button
        onClick={onPurchase}
        className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium"
        style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
      >
        追加チケット購入
      </button>
    </section>
  );
}
