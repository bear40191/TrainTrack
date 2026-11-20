'use client';

import React from 'react';

export interface TrainTrackLogoProps {
  /** รูปแบบการแสดงผล: 'full' (ไอคอน+ข้อความ), 'icon' (เฉพาะสัญลักษณ์ TT), 'app-icon' (สี่เหลี่ยมโค้งแบบไอคอนมือถือ), 'wordmark' (เฉพาะข้อความแบรนด์) */
  variant?: 'full' | 'icon' | 'app-icon' | 'wordmark';
  /** ขนาดความกว้าง/สูง (px) */
  size?: number;
  /** ชุดสี: 'brand' (เขียว+เขียวเข้ม), 'white-dark' (ขาว+เขียวเข้ม สำหรับพื้นหลังเขียว), 'white-mint' (ขาว+เขียวมิ้นต์ สำหรับพื้นหลังเข้ม) */
  colorMode?: 'brand' | 'white-dark' | 'white-mint';
  /** คลาส CSS เพิ่มเติม */
  className?: string;
  /** แสดงเฉพาะตัวหนังสือ หรือไม่ (หรือใช้ variant='wordmark') */
  textOnly?: boolean;
}

export const TrainTrackLogo: React.FC<TrainTrackLogoProps> = ({
  variant = 'icon',
  size = 36,
  colorMode = 'brand',
  className = '',
  textOnly = false,
}) => {
  // กำหนดคู่สีของตัว T ทั้งสองตัว
  let firstTColor = '#16A34A'; // เขียวสด (ตัวบน-ซ้าย)
  let secondTColor = '#0B3D2A'; // เขียวเข้มป่า (ตัวล่าง-ขวา)

  if (colorMode === 'white-dark') {
    firstTColor = '#FFFFFF';
    secondTColor = '#0B3D2A';
  } else if (colorMode === 'white-mint') {
    firstTColor = '#FFFFFF';
    secondTColor = '#6FD098';
  }

  // ไอคอน SVG สัญลักษณ์ตัว T สองตัวประกบกัน (Interlocking TT Track)
  const renderIconSvg = (iconWidth: number, iconHeight: number) => (
    <svg
      viewBox="10 12 114 96"
      width={iconWidth}
      height={iconHeight}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TrainTrack Interlocking TT Logo"
      className="shrink-0 transition-transform duration-200"
    >
      {/* ตัว T ที่ 1 (บน-ซ้าย) */}
      <rect x="14" y="16" width="60" height="18" rx="4" fill={firstTColor} />
      <rect x="34" y="34" width="20" height="70" rx="4" fill={firstTColor} />

      {/* ตัว T ที่ 2 (ล่าง-ขวา คว่ำเข้าหากันประสานราง) */}
      <rect x="60" y="86" width="60" height="18" rx="4" fill={secondTColor} />
      <rect x="80" y="16" width="20" height="70" rx="4" fill={secondTColor} />
    </svg>
  );

  // สไตล์ข้อความ TrainTrack Wordmark
  const renderWordmark = (fontSize: number) => (
    <span
      className="font-extrabold tracking-tight select-none inline-flex items-baseline"
      style={{ fontSize: `${fontSize}px`, lineHeight: 1 }}
    >
      <span className={colorMode === 'white-dark' || colorMode === 'white-mint' ? 'text-white' : 'text-[#0B3D2A]'}>
        Train
      </span>
      <span className={colorMode === 'white-dark' || colorMode === 'white-mint' ? 'text-[#6FD098]' : 'text-[#16A34A]'}>
        Track
      </span>
    </span>
  );

  if (textOnly || variant === 'wordmark') {
    return <span className={`inline-flex items-center ${className}`}>{renderWordmark(size)}</span>;
  }

  // กรณี variant = 'app-icon' (สี่เหลี่ยมโค้งมนเหมือนแอปโทรศัพท์มือถือ Hybrid)
  if (variant === 'app-icon') {
    const iconW = Math.round(size * 0.64);
    const iconH = Math.round(iconW * (96 / 114));
    const radius = Math.round(size * 0.23);

    return (
      <div
        className={`inline-flex items-center justify-center bg-[#16A34A] shadow-md transition-transform duration-200 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${radius}px`,
        }}
        title="TrainTrack Mobile App"
      >
        {/* สำหรับ App Icon สีเขียว ตัวแรกเป็นขาว ตัวสองเป็นเขียวเข้ม */}
        <svg
          viewBox="10 12 114 96"
          width={iconW}
          height={iconH}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="14" y="16" width="60" height="18" rx="4" fill="#FFFFFF" />
          <rect x="34" y="34" width="20" height="70" rx="4" fill="#FFFFFF" />
          <rect x="60" y="86" width="60" height="18" rx="4" fill="#0B3D2A" />
          <rect x="80" y="16" width="20" height="70" rx="4" fill="#0B3D2A" />
        </svg>
      </div>
    );
  }

  // กรณี variant = 'full' (ไอคอนคู่กับ Wordmark)
  if (variant === 'full') {
    const iconW = size;
    const iconH = Math.round(size * (96 / 114));
    const fontSize = Math.max(14, Math.round(size * 0.72));

    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {renderIconSvg(iconW, iconH)}
        {renderWordmark(fontSize)}
      </div>
    );
  }

  // กรณี variant = 'icon' (เฉพาะตัวไอคอน)
  const iconH = Math.round(size * (96 / 114));
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      {renderIconSvg(size, iconH)}
    </div>
  );
};

export default TrainTrackLogo;
