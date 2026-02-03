'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  glowIntensity?: 'low' | 'medium' | 'high';
}

/**
 * 霓虹按钮组件 - 赛博朋克风格
 * 特点：发光效果、扫描线动画、Hover 状态
 */
export default function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  glowIntensity = 'medium',
  className = '',
  disabled = false,
  ...props
}: NeonButtonProps) {
  // 变体样式映射
  const variantStyles = {
    primary: {
      bg: 'bg-cyan-500',
      text: 'text-gray-900',
      border: 'border-cyan-500',
      glow: 'shadow-[0_0_20px_rgba(0,255,255,0.5)]',
      hoverGlow: 'hover:shadow-[0_0_30px_rgba(0,255,255,0.8)]',
    },
    secondary: {
      bg: 'bg-transparent',
      text: 'text-cyan-500',
      border: 'border-cyan-500',
      glow: 'shadow-[0_0_15px_rgba(0,255,255,0.3)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(255,0,255,0.6)]',
    },
    danger: {
      bg: 'bg-transparent',
      text: 'text-red-500',
      border: 'border-red-500',
      glow: 'shadow-[0_0_15px_rgba(255,0,85,0.3)]',
      hoverGlow: 'hover:shadow-[0_0_25px_rgba(255,0,85,0.6)]',
    },
  };

  // 尺寸样式映射
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const styles = variantStyles[variant];

  return (
    <button
      className={`
        relative
        ${styles.bg}
        ${styles.text}
        ${styles.border}
        ${styles.glow}
        ${styles.hoverGlow}
        border-2
        ${sizeStyles[size]}
        font-semibold
        rounded
        overflow-hidden
        transition-all
        duration-300
        hover:scale-105
        active:scale-95
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {/* 扫描线动画 - Hover 时激活 */}
      <div
        className="
          absolute
          inset-0
          opacity-0
          hover:opacity-100
          transition-opacity
          duration-300
          pointer-events-none
        "
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          animation: 'scan 2s linear infinite',
        }}
      />

      {/* 按钮内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>

      {/* 内发光效果 */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-transparent
          via-white/10
          to-transparent
          opacity-0
          hover:opacity-100
          transition-opacity
          duration-300
          pointer-events-none
        "
      />

      {/* 扫描线动画的 keyframes */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
}
