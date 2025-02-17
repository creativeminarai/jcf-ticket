import Image from 'next/image';
import { Shop } from '@/types/ticket';

interface DestinyCoffeeProps {
  issuedShop: Shop | null;
  isLoading: boolean;
  onIssueTicket: () => void;
}

export function DestinyCoffee({ issuedShop, isLoading, onIssueTicket }: DestinyCoffeeProps) {
  return (
    <section className="bg-white overflow-hidden shadow-lg rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        運命のコーヒー
      </h2>
      {!issuedShop ? (
        <>
          <button
            onClick={onIssueTicket}
            disabled={isLoading}
            className="w-full text-white px-4 py-3 rounded-md hover:opacity-90 transition-colors font-medium relative"
            style={{ background: 'linear-gradient(135deg, hsl(222.2, 47.4%, 11.20%), hsl(222.2, 47.4%, 15.20%))' }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                発行中...
              </div>
            ) : (
              "チケット発行"
            )}
          </button>
          <p className="text-sm text-gray-600 mt-3 text-center">・使用する日に発券してください。</p>
        </>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full aspect-square max-w-md mx-auto">
            <Image
              src={issuedShop.imageUrl}
              alt={issuedShop.name}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 384px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{issuedShop.name}</h3>
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[0.7rem] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  出品コーヒー
                </span>
                <span className="text-gray-700">「{issuedShop.coffeeName}」</span>
              </div>
              <p className="text-gray-600 text-sm italic whitespace-pre-wrap">
                {issuedShop.coffeeIntro}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
