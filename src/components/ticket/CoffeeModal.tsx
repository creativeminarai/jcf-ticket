"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Shop } from '@/types/ticket';
import { CoffeeStainNumber } from '@/components/ui/CoffeeStainNumber';

interface CoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShop: Shop | null;
  coffeeShops?: Shop[]; // 互換性のために残す（使用しない）
}

export function CoffeeModal({ isOpen, onClose, selectedShop }: CoffeeModalProps) {
  // アニメーション管理のためのシンプルな状態
  const [animationState, setAnimationState] = useState<'initial' | 'blurring' | 'result'>('initial');
  
  // モーダルが開いたときの処理
  useEffect(() => {
    if (isOpen && selectedShop) {
      // 初期状態にリセット
      setAnimationState('initial');
      
      // GIF表示後に変化するタイマー
      const gifTimer = setTimeout(() => {
        // ブラー状態へ
        setAnimationState('blurring');
        
        // ブラー後に結果表示
        setTimeout(() => {
          setAnimationState('result');
        }, 500);
      }, 2000); // 2秒に短縮
      
      return () => {
        clearTimeout(gifTimer);
      };
    }
  }, [isOpen, selectedShop]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-100/90">
      <div className="w-full max-w-md mx-4 overflow-hidden rounded-lg bg-gradient-to-b from-white to-gray-50 shadow-xl border border-amber-200">
        {/* ヘッダー部分 */}
        <div className="relative py-6 px-4 text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
          <h2 className="text-2xl font-serif text-amber-800 tracking-wide">
            {animationState === 'result' ? '運命のコーヒーが決まりました！' : '運命のコーヒー'}
          </h2>
          <div className="mt-1 h-px w-24 mx-auto bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
        </div>
        
        <div className="px-6 pb-10">
          <div className="relative overflow-hidden rounded-lg bg-amber-50 p-6 shadow-sm">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-100 rounded-full blur-xl opacity-50"></div>
            
            {/* アニメーション表示エリア */}
            <div className="relative mx-auto w-full aspect-square max-w-xs mb-4 overflow-hidden rounded-lg">
              {/* 1. 選ばれたコーヒーショップの画像（最初は見えない） */}
              {selectedShop && (
                <div className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                  animationState === 'result' ? 'opacity-100' : 'opacity-0'
                }`}>
                  <Image
                    src={selectedShop.imageUrl}
                    alt={selectedShop.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 100vw, 384px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-50/40 via-transparent to-transparent"></div>
                </div>
              )}
              
              {/* 2. GIFアニメーション */}
              {animationState !== 'result' && (
                <div className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-500 ${
                  animationState === 'blurring' ? 'opacity-0 blur-md' : 'opacity-100'
                }`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-amber-200 animate-ping opacity-50"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-amber-100 animate-pulse"></div>
                  </div>
                  <div className="w-full h-full relative overflow-hidden rounded-lg">
                    <img
                      src="/gif-output-Tue04Mar2025163644GMT.gif"
                      alt="coffee ripple animation"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-50/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute bottom-4 inline-block px-5 py-2 bg-amber-200 text-amber-800 rounded-full font-medium tracking-wide animate-pulse">
                    くじ引き中...
                  </div>
                </div>
              )}
            </div>
            
            {/* 選ばれたコーヒーの情報 */}
            {selectedShop && (
              <div className={`space-y-4 transition-all duration-500 ${
                animationState === 'result' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>
                <div className="flex items-center gap-3">
                  <CoffeeStainNumber number={selectedShop.number} size={60} className="text-gray-700" />
                  <h4 className="text-xl font-serif text-amber-800 tracking-wide">{selectedShop.name}</h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[0.7rem] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                    出品コーヒー
                  </span>
                  <span className="text-amber-700 font-medium">「{selectedShop.coffeeName}」</span>
                </div>
                
                <p className="text-gray-600 text-sm italic whitespace-pre-wrap border-t border-amber-100 pt-3 mt-2">
                  {selectedShop.coffeeIntro}
                </p>
              </div>
            )}
          </div>
          
          {/* ボタンエリア */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-600 rounded-md font-medium tracking-wide"
            >
              {animationState === 'result' ? '閉じる' : 'スキップ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
