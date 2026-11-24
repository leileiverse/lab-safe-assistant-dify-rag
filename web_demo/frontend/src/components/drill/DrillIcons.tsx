import type { FC } from 'react';

/**
 * 安全闯关游戏 SVG 图标库
 * 全部使用线性/填充 SVG，支持颜色继承 currentColor
 */

interface IconProps {
  size?: number;
  className?: string;
}

// 浓硫酸试剂瓶
export const SulfuricAcidBottleIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="26" y="6" width="12" height="10" rx="2" />
    <rect x="24" y="4" width="16" height="4" rx="1" />
    <path d="M22 16 L14 36 Q12 54 28 58 L36 58 Q52 54 50 36 L42 16 Z" />
    <path d="M17 40 Q20 48 28 50 L36 50 Q44 48 47 40 L46 38 L18 38 Z" fill="currentColor" fillOpacity="0.25" stroke="none" />
    <text x="32" y="46" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" stroke="none">H2SO4</text>
  </svg>
);

// 烧杯
export const BeakerIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 10 L18 26 L12 52 Q12 58 20 58 L44 58 Q52 58 52 52 L46 26 L46 10" />
    <line x1="14" y1="10" x2="50" y2="10" />
    <path d="M15 42 Q18 50 28 52 L36 52 Q46 50 49 42 L48 34 L16 34 Z" fill="currentColor" fillOpacity="0.2" stroke="none" />
    <line x1="18" y1="30" x2="24" y2="30" />
    <line x1="18" y1="38" x2="22" y2="38" />
    <line x1="18" y1="46" x2="24" y2="46" />
  </svg>
);

// 量筒
export const CylinderIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10 L20 52 Q20 58 32 58 Q44 58 44 52 L44 10" />
    <ellipse cx="32" cy="10" rx="12" ry="4" />
    <ellipse cx="32" cy="58" rx="12" ry="4" />
    <path d="M22 40 Q22 52 32 54 Q42 52 42 40 L42 32 L22 32 Z" fill="currentColor" fillOpacity="0.2" stroke="none" />
    <line x1="24" y1="24" x2="30" y2="24" />
    <line x1="24" y1="32" x2="28" y2="32" />
    <line x1="24" y1="40" x2="30" y2="40" />
  </svg>
);

// 护目镜
export const GogglesIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="22" cy="32" rx="14" ry="12" />
    <ellipse cx="42" cy="32" rx="14" ry="12" />
    <path d="M14 26 Q18 22 22 24" strokeWidth="1.5" />
    <path d="M34 26 Q38 22 42 24" strokeWidth="1.5" />
    <path d="M30 32 L34 32" />
    <path d="M8 32 Q4 28 4 22" />
    <path d="M56 32 Q60 28 60 22" />
    <path d="M4 22 L60 22" />
  </svg>
);

// 橡胶手套
export const GlovesIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 14 L20 26 L14 38 L14 52 Q14 58 22 58 L42 58 Q50 58 50 52 L50 38 L44 26 L44 14" />
    <path d="M20 14 Q20 8 24 8 Q28 8 28 14 L28 22" />
    <path d="M28 10 Q28 4 32 4 Q36 4 36 10 L36 22" />
    <path d="M36 10 Q36 4 40 4 Q44 4 44 10 L44 22" />
    <line x1="16" y1="46" x2="48" y2="46" />
    <line x1="18" y1="50" x2="46" y2="50" />
  </svg>
);

// 废液桶
export const WasteBinIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 16 L18 56 Q18 60 26 60 L38 60 Q46 60 46 56 L50 16" />
    <rect x="12" y="10" width="40" height="6" rx="2" />
    <path d="M20 10 Q20 2 32 2 Q44 2 44 10" />
    <text x="32" y="42" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor" stroke="none">!</text>
    <line x1="20" y1="26" x2="44" y2="26" />
    <line x1="22" y1="34" x2="42" y2="34" />
  </svg>
);

// 火苗
export const FireIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
    stroke="none"
  >
    <path d="M32 6 Q38 16 36 22 Q42 18 46 26 Q50 36 44 48 Q40 58 32 58 Q24 58 20 48 Q14 38 18 28 Q22 20 24 24 Q26 16 32 6 Z" fillOpacity="0.9" />
    <path d="M32 22 Q36 28 34 32 Q38 30 40 36 Q42 44 38 50 Q36 54 32 54 Q28 54 26 50 Q22 44 24 38 Q26 34 28 34 Q28 28 32 22 Z" fillOpacity="0.5" />
  </svg>
);

// 漏电闪电
export const ElectricShockIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="currentColor"
    stroke="none"
  >
    <path d="M36 4 L12 36 L26 36 L20 60 L52 24 L38 24 L46 4 Z" fillOpacity="0.9" />
  </svg>
);

// 橙红色告警光晕
export const AlertGlowIcon: FC<IconProps> = ({ size = 120, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    fill="none"
  >
    <defs>
      <radialGradient id="alertGlowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
        <stop offset="40%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#alertGlowGrad)" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" />
    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
  </svg>
);

// 化学灼伤抽象警示符号
export const BurnWarningIcon: FC<IconProps> = ({ size = 48, className = '' }) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M32 6 L58 52 L6 52 Z" />
    <text x="32" y="38" textAnchor="middle" fontSize="24" fontWeight="bold" fill="currentColor" stroke="none">!</text>
  </svg>
);


// ====== 安全闯关小机器人 LAB-BOT ======
// 卡通科技风，支持 idle / run / shatter / cheer 状态
export const LabBotIcon: FC<IconProps> = ({ size = 72, className = '' }) => (
  <svg
    viewBox="0 0 120 140"
    width={size}
    height={size}
    className={`labbot ${className}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 天线 + 信号灯 */}
    <g className="labbot-antenna">
      <line x1="60" y1="8" x2="60" y2="22" strokeWidth="2.5" />
      <circle cx="60" cy="6" r="4" fill="#22d3ee" stroke="none">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </g>

    {/* 头部 */}
    <g className="labbot-head">
      <rect x="28" y="22" width="64" height="44" rx="18" fill="rgba(15, 23, 42, 0.9)" />
      <path d="M34 28 Q60 18 86 28" strokeOpacity="0.35" />
      {/* 眼睛大屏 */}
      <g className="labbot-eyes">
        <rect x="40" y="36" width="14" height="18" rx="4" fill="currentColor" fillOpacity="0.18" stroke="none" />
        <rect x="66" y="36" width="14" height="18" rx="4" fill="currentColor" fillOpacity="0.18" stroke="none" />
        <circle cx="47" cy="45" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="73" cy="45" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="48.5" cy="43.5" r="1" fill="#fff" stroke="none" />
        <circle cx="74.5" cy="43.5" r="1" fill="#fff" stroke="none" />
      </g>
      {/* 嘴巴扫描线 */}
      <line x1="52" y1="60" x2="68" y2="60" strokeOpacity="0.5" strokeWidth="1.5">
        <animate attributeName="stroke-opacity" values="0.2;1;0.2" dur="1.2s" repeatCount="indefinite" />
      </line>
      {/* 脸颊灯 */}
      <circle cx="36" cy="52" r="1.8" fill="#22d3ee" stroke="none">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="84" cy="52" r="1.8" fill="#22d3ee" stroke="none">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" begin="0.5s" repeatCount="indefinite" />
      </circle>
    </g>

    {/* 颈部 */}
    <g className="labbot-neck">
      <rect x="52" y="66" width="16" height="8" rx="2" fill="rgba(15, 23, 42, 0.9)" />
      <line x1="56" y1="70" x2="64" y2="70" strokeOpacity="0.4" />
    </g>

    {/* 身体 */}
    <g className="labbot-body">
      <rect x="32" y="74" width="56" height="44" rx="14" fill="rgba(15, 23, 42, 0.9)" />
      {/* 胸前能量屏 */}
      <rect x="44" y="82" width="32" height="22" rx="5" fill="currentColor" fillOpacity="0.12" stroke="none" />
      <path
        d="M47 93 L52 93 L54 86 L58 100 L62 90 L66 93 L73 93"
        strokeWidth="1.5"
        fill="none"
        strokeOpacity="0.7"
      >
        <animate
          attributeName="stroke-dasharray"
          values="0 80;80 0"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </path>
      <circle cx="38" cy="108" r="2" fill="#22d3ee" stroke="none" />
      <circle cx="82" cy="108" r="2" fill="#22d3ee" stroke="none" />
      <line x1="40" y1="114" x2="80" y2="114" strokeOpacity="0.3" />
    </g>

    {/* 左臂 */}
    <g className="labbot-arm labbot-arm-l">
      <rect x="18" y="78" width="14" height="26" rx="6" fill="rgba(15, 23, 42, 0.9)" />
      <circle cx="25" cy="106" r="6" fill="currentColor" fillOpacity="0.15" />
    </g>

    {/* 右臂 */}
    <g className="labbot-arm labbot-arm-r">
      <rect x="88" y="78" width="14" height="26" rx="6" fill="rgba(15, 23, 42, 0.9)" />
      <circle cx="95" cy="106" r="6" fill="currentColor" fillOpacity="0.15" />
    </g>

    {/* 左腿 */}
    <g className="labbot-leg labbot-leg-l">
      <rect x="42" y="118" width="12" height="18" rx="4" fill="rgba(15, 23, 42, 0.9)" />
      <rect x="38" y="132" width="20" height="6" rx="3" fill="currentColor" fillOpacity="0.15" />
    </g>

    {/* 右腿 */}
    <g className="labbot-leg labbot-leg-r">
      <rect x="66" y="118" width="12" height="18" rx="4" fill="rgba(15, 23, 42, 0.9)" />
      <rect x="62" y="132" width="20" height="6" rx="3" fill="currentColor" fillOpacity="0.15" />
    </g>

    {/* 脚下光 */}
    <ellipse cx="60" cy="138" rx="22" ry="3" fill="currentColor" fillOpacity="0.25">
      <animate attributeName="rx" values="22;28;22" dur="2s" repeatCount="indefinite" />
    </ellipse>
  </svg>
);


// ====== 图标映射表（供动态渲染）======

export const SVG_ICON_MAP: Record<string, FC<IconProps>> = {
  'LAB-BOT': LabBotIcon,
  '浓硫酸试剂瓶': SulfuricAcidBottleIcon,
  '烧杯': BeakerIcon,
  '量筒': CylinderIcon,
  '护目镜': GogglesIcon,
  '橡胶手套': GlovesIcon,
  '废液桶': WasteBinIcon,
  '火苗': FireIcon,
  '漏电闪电': ElectricShockIcon,
  '橙红色告警光晕': AlertGlowIcon,
  '化学灼伤抽象警示符号': BurnWarningIcon,
};
