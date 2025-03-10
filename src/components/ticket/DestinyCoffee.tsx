import Image from 'next/image';
import { useState } from 'react';
import { Shop } from '@/types/ticket';
import { CoffeeModal } from './CoffeeModal';
import { CoffeeStainNumber } from '@/components/ui/CoffeeStainNumber';

interface DestinyCoffeeProps {
  issuedShop: Shop | null;
  isLoading: boolean;
  onIssueTicket: () => void;
  coffeeShops: Shop[]; // 互換性のために残します
}

export function DestinyCoffee({ issuedShop, isLoading, onIssueTicket, coffeeShops }: DestinyCoffeeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-lg bg-gradient-to-b from-white to-gray-50 shadow-xl border border-amber-200">
      {/* ヘッダー部分 */}
      <div className="relative py-6 px-4 text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
        <h2 className="text-2xl font-serif text-amber-800 tracking-wide">
          運命のコーヒー
        </h2>
        <div className="mt-1 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
      </div>
      
      <div className="px-6 pb-10">
        {!issuedShop ? (
          <div className="relative overflow-hidden rounded-lg bg-amber-50 p-6 shadow-sm">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            
            <button
              onClick={() => {
                onIssueTicket();
                // チケット発行と同時にモーダルを開く
                setIsModalOpen(true);
              }}
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-md transition-colors font-medium tracking-wide shadow-sm"
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
            <p className="text-sm text-amber-800 mt-4 text-center italic">・使用する日に発券してください。</p>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg bg-amber-50 p-6 shadow-sm">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            
            <div className="space-y-6">
              <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden rounded-lg">
                <Image
                  src={issuedShop.imageUrl}
                  alt={issuedShop.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-50/40 via-transparent to-transparent"></div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <CoffeeStainNumber number={issuedShop.number} size={56} className="text-gray-700" />
                  <h3 className="text-xl font-serif text-amber-800 tracking-wide">{issuedShop.name}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      出品コーヒー
                    </span>
                    <span className="text-amber-700 font-medium">「{issuedShop.coffeeName}」</span>
                  </div>
                  <p className="text-gray-600 text-sm italic whitespace-pre-wrap border-t border-amber-100 pt-3">
                    {issuedShop.coffeeIntro}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* くじ引きモーダル */}
      <CoffeeModal
        isOpen={isModalOpen && issuedShop !== null}
        onClose={() => setIsModalOpen(false)}
        selectedShop={issuedShop}
      />
    </section>
  );
}
