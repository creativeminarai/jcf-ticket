"use client";

import Image from 'next/image';

interface CoffeeStainNumberProps {
  number: number;
  className?: string;
  size?: number;
}

export function CoffeeStainNumber({ number, className = "", size = 40 }: CoffeeStainNumberProps) {
  // 番号を2桁までに制限
  const displayNumber = Math.min(99, Math.max(1, Math.floor(number)));
  
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {/* コーヒーの染み画像 */}
      <Image 
        src="/コーヒーの染み.png"
        alt="コーヒーの染み"
        fill
        className="object-contain"
        sizes={`${size}px`}
      />
      
      {/* 番号を明朝体で表示 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-serif" style={{ 
          fontSize: size * 0.4,
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          fontFamily: "'Noto Serif JP', serif",
        }}>
          {displayNumber}
        </span>
      </div>
    </div>
  );
}
