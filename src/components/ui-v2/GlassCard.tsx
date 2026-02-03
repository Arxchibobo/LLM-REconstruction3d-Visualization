'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'yellow';
  noBorder?: boolean;
}

/**
 * 玻璃态卡片组件 - 赛博朋克风格
 * 特点：毛玻璃效果、霓虹边框、发光效果
 */
export default function GlassCard({
  children,
  className = '',
  glowColor = 'cyan',
  noBorder = false,
}: GlassCardProps) {
  // 发光颜色映射
  const glowColors = {
    cyan: 'shadow-[0_0_20px_rgba(0,255,255,0.3)]',
    magenta: 'shadow-[0_0_20px_rgba(255,0,255,0.3)]',
    yellow: 'shadow-[0_0_20px_rgba(255,255,0,0.3)]',
  };

  // 边框颜色映射
  const borderColors = {
    cyan: 'border-cyan-500/30',
    magenta: 'border-magenta-500/30',
    yellow: 'border-yellow-500/30',
  };

  return (
    <div
      className={`
        relative
        bg-[rgba(26,30,63,0.6)]
        backdrop-blur-md
        ${noBorder ? '' : `border ${borderColors[glowColor]}`}
        rounded-lg
        ${glowColors[glowColor]}
        transition-all
        duration-300
        hover:${glowColors[glowColor].replace('0.3', '0.5')}
        ${className}
      `}
    >
      {/* 角落装饰线 */}
      {!noBorder && (
        <>
          {/* 左上角 */}
          <div
            className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${borderColors[glowColor]}`}
          />
          {/* 右上角 */}
          <div
            className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${borderColors[glowColor]}`}
          />
          {/* 左下角 */}
          <div
            className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${borderColors[glowColor]}`}
          />
          {/* 右下角 */}
          <div
            className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${borderColors[glowColor]}`}
          />
        </>
      )}

      {/* 内容 */}
      <div className="relative z-10">{children}</div>

      {/* 扫描线效果 */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
}
