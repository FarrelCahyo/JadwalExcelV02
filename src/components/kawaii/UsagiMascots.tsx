import React from 'react';

export type BunnyMood = 'happy' | 'sunny' | 'moon' | 'lembur' | 'sleepy';

interface BunnyNurseAvatarProps {
  mood?: BunnyMood;
  size?: number;
  isCrown?: boolean;
  className?: string;
}

/**
 * Custom authored SVG Kawaii Lop Bunny Nurse ("UsagiBerry UI")
 * Consistent stroke weight (2.2px #4A1525), rosy cheeks, nurse cap with strawberry heart.
 */
export const BunnyNurseAvatar: React.FC<BunnyNurseAvatarProps> = ({
  mood = 'happy',
  size = 56,
  isCrown = false,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Soft pastel halo behind bunny */}
      <circle
        cx="40"
        cy="44"
        r="32"
        fill={
          mood === 'lembur'
            ? '#FFD6E4'
            : mood === 'sunny'
            ? '#FFF3C4'
            : mood === 'moon'
            ? '#F3E8FF'
            : mood === 'sleepy'
            ? '#DCFCE7'
            : '#FFE2EE'
        }
      />

      {/* Left Lop Ear */}
      <path
        d="M22 30C13 31 9 43 12 54C14 60 20 61 23 55C26 49 25 38 25 33"
        fill="#FFFFFF"
        stroke="#4A1525"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 36C15 39 14 47 16 52C17 55 20 55 21 51"
        fill="#FBCFE8"
      />

      {/* Right Lop Ear */}
      <path
        d="M58 30C67 31 71 43 68 54C66 60 60 61 57 55C54 49 55 38 55 33"
        fill="#FFFFFF"
        stroke="#4A1525"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M61 36C65 39 66 47 64 52C63 55 60 55 59 51"
        fill="#FBCFE8"
      />

      {/* Chubby Bunny Head */}
      <ellipse
        cx="40"
        cy="46"
        rx="22"
        ry="19"
        fill="#FFFFFF"
        stroke="#4A1525"
        strokeWidth="2.4"
      />

      {/* Rosy Strawberry Cheeks */}
      <ellipse cx="26" cy="49" rx="4.2" ry="2.5" fill="#FF8DA8" opacity="0.75" />
      <ellipse cx="54" cy="49" rx="4.2" ry="2.5" fill="#FF8DA8" opacity="0.75" />

      {/* Eyes by Mood */}
      {mood === 'sleepy' ? (
        <>
          <path
            d="M28 44C30 46.5 33 46.5 35 44"
            stroke="#4A1525"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M45 44C47 46.5 50 46.5 52 44"
            stroke="#4A1525"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Cute sleeping bubble */}
          <circle cx="59" cy="39" r="4.5" fill="#E0F2FE" stroke="#4A1525" strokeWidth="1.6" />
        </>
      ) : mood === 'lembur' ? (
        <>
          {/* Starry sparkling overtime eyes */}
          <circle cx="31.5" cy="44" r="3.4" fill="#4A1525" />
          <circle cx="30.5" cy="42.8" r="1.3" fill="#FFFFFF" />
          <circle cx="32.8" cy="45.2" r="0.8" fill="#FFD166" />
          <circle cx="48.5" cy="44" r="3.4" fill="#4A1525" />
          <circle cx="47.5" cy="42.8" r="1.3" fill="#FFFFFF" />
          <circle cx="49.8" cy="45.2" r="0.8" fill="#FFD166" />
        </>
      ) : (
        <>
          <circle cx="31.5" cy="44" r="2.8" fill="#4A1525" />
          <circle cx="30.7" cy="43" r="1.1" fill="#FFFFFF" />
          <circle cx="48.5" cy="44" r="2.8" fill="#4A1525" />
          <circle cx="47.7" cy="43" r="1.1" fill="#FFFFFF" />
        </>
      )}

      {/* Cute Bunny Nose & ":3" Mouth */}
      <ellipse cx="40" cy="47.2" rx="2" ry="1.4" fill="#FF4D79" />
      <path
        d="M36.5 50.2C38 52 40 51 40 49.2C40 51 42 52 43.5 50.2"
        stroke="#4A1525"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Nurse Cap on Top of Head */}
      <path
        d="M24 29L27 17C35 14.5 45 14.5 53 17L56 29C46 31.5 34 31.5 24 29Z"
        fill="#FFFFFF"
        stroke="#4A1525"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Nurse Cap Pink Trim */}
      <path
        d="M24.5 28.5C34 31 46 31 55.5 28.5"
        stroke="#FF4D79"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Strawberry Heart Emblem on Nurse Cap */}
      <path
        d="M40 25.5C40 25.5 35.5 22.8 35.5 20.3C35.5 18.8 36.8 17.8 38.2 17.8C39.1 17.8 39.7 18.3 40 19C40.3 18.3 40.9 17.8 41.8 17.8C43.2 17.8 44.5 18.8 44.5 20.3C44.5 22.8 40 25.5 40 25.5Z"
        fill="#FF4D79"
      />

      {/* Special Strawberry Ribbon Bow on Left Ear for Afiz / Highlighted Nurse */}
      {isCrown && (
        <g transform="translate(15, 22)">
          <path
            d="M8 6C4 2 0 4 1 8C2 11 6 10 8 8Z"
            fill="#FF4D79"
            stroke="#4A1525"
            strokeWidth="1.8"
          />
          <path
            d="M10 6C14 2 18 4 17 8C16 11 12 10 10 8Z"
            fill="#FF4D79"
            stroke="#4A1525"
            strokeWidth="1.8"
          />
          <circle cx="9" cy="7" r="2.3" fill="#FFF3C4" stroke="#4A1525" strokeWidth="1.6" />
        </g>
      )}

      {/* Mini Stethoscope Collar */}
      <path
        d="M31 62C33 67 47 67 49 62"
        stroke="#FF4D79"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="45" cy="65" r="3" fill="#FFF3C4" stroke="#4A1525" strokeWidth="1.8" />
    </svg>
  );
};

/**
 * Sunny Cloud SVG Icon for Morning Shifts (06.00 - 10.59)
 */
export const SunnyCloudIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Sun rays */}
    <g stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
      <line x1="20" y1="6" x2="20" y2="9" />
      <line x1="9" y1="11" x2="11.5" y2="13.5" />
      <line x1="5" y1="22" x2="8.5" y2="22" />
      <line x1="31" y1="11" x2="28.5" y2="13.5" />
    </g>
    {/* Smiling Sun */}
    <circle cx="20" cy="21" r="9.5" fill="#FDE047" stroke="#4A1525" strokeWidth="2.2" />
    <circle cx="17" cy="19.5" r="1.2" fill="#4A1525" />
    <circle cx="23" cy="19.5" r="1.2" fill="#4A1525" />
    <path d="M18 22.2C19 23.4 21 23.4 22 22.2" stroke="#4A1525" strokeWidth="1.8" strokeLinecap="round" />
    {/* Fluffy Cloud in Front */}
    <path
      d="M17 37H37C40.5 37 43 34.5 43 31.2C43 28.2 40.8 25.8 37.8 25.5C37 20.8 33 17.5 28.2 17.5C23.8 17.5 20.1 20.3 19 24.4C15.5 24.7 13 27.5 13 30.8C13 34.3 15.8 37 17 37Z"
      fill="#FFFFFF"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <ellipse cx="24" cy="31.5" rx="2" ry="1.2" fill="#FF8DA8" opacity="0.65" />
    <ellipse cx="34" cy="31.5" rx="2" ry="1.2" fill="#FF8DA8" opacity="0.65" />
  </svg>
);

/**
 * Dreamy Crescent Moon & Stars SVG Icon for Afternoon/Evening Shifts (11.00 - 21.00)
 */
export const DreamyMoonIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    {/* Pastel Lavender Halo */}
    <circle cx="24" cy="24" r="19" fill="#F3E8FF" />
    {/* Crescent Moon */}
    <path
      d="M29.5 10.5C22.5 11.8 18 18.5 19.5 25.5C21 32.5 27.8 36.8 34.8 35.2C31.2 38.5 25.8 39.8 20.5 38C12.5 35.2 8.5 26.2 11.2 18.2C13.5 11.6 19.8 7.8 26.5 8.5C27.6 8.6 28.6 9.4 29.5 10.5Z"
      fill="#FDE047"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Sleeping eye on moon */}
    <path d="M16.5 23.5C17.8 24.8 19.5 24.8 20.8 23.5" stroke="#4A1525" strokeWidth="1.8" strokeLinecap="round" />
    <ellipse cx="16.5" cy="26" rx="2" ry="1.2" fill="#FF8DA8" opacity="0.8" />
    {/* Twinkling Stars */}
    <path
      d="M35 13L36.2 16.2L39.5 17.5L36.2 18.8L35 22L33.8 18.8L30.5 17.5L33.8 16.2L35 13Z"
      fill="#FF4D79"
      stroke="#4A1525"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="28" cy="27" r="2" fill="#A855F7" />
    {/* Mini Cloud at bottom */}
    <path
      d="M21 39H36C38.5 39 40.5 37.2 40.5 34.8C40.5 32.6 38.8 30.8 36.6 30.6C35.8 27.6 33 25.5 29.8 25.5C26.4 25.5 23.6 27.8 23 31C20.5 31.3 18.8 33.2 18.8 35.5C18.8 37.5 20.2 39 21 39Z"
      fill="#FFFFFF"
      stroke="#4A1525"
      strokeWidth="2"
    />
  </svg>
);

/**
 * Strawberry Milk Bottle SVG Icon (Single or Double for Overtime 2-Slot!)
 */
export const StrawberryMilkBottleIcon: React.FC<{
  double?: boolean;
  size?: number;
  className?: string;
}> = ({ double = false, size = 38, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    {double && (
      <g transform="translate(15, 2) rotate(11 20 26)">
        <rect x="15" y="9" width="12" height="5" rx="2" fill="#FF4D79" stroke="#4A1525" strokeWidth="2" />
        <path
          d="M16 14H26L29 22V42C29 44.8 26.8 47 24 47H18C15.2 47 13 44.8 13 42V22L16 14Z"
          fill="#FFE2EE"
          stroke="#4A1525"
          strokeWidth="2"
        />
        <rect x="13" y="25" width="16" height="13" fill="#FF8DA8" opacity="0.45" />
      </g>
    )}
    <g transform={double ? 'translate(-6, 2) rotate(-7 24 28)' : 'translate(4, 2)'}>
      {/* Straw */}
      <path d="M26 3L23 11" stroke="#FF4D79" strokeWidth="3" strokeLinecap="round" />
      {/* Bottle Rim */}
      <rect x="17" y="9" width="14" height="5" rx="2.5" fill="#FF4D79" stroke="#4A1525" strokeWidth="2.2" />
      {/* Bottle Body */}
      <path
        d="M18.5 14H29.5L33 23V43C33 46.3 30.3 49 27 49H21C17.7 49 15 46.3 15 43V23L18.5 14Z"
        fill="#FFFFFF"
        stroke="#4A1525"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Pink Strawberry Milk Fill */}
      <path
        d="M16.2 24C20 22.5 28 25.5 31.8 24V42.5C31.8 45.2 29.6 47.5 26.8 47.5H21.2C18.4 47.5 16.2 45.2 16.2 42.5V24Z"
        fill="#FFD6E4"
      />
      {/* Cute Strawberry on Label */}
      <path
        d="M24 39C24 39 19.5 35.8 19.5 32.5C19.5 30.2 21.5 29 24 29C26.5 29 28.5 30.2 28.5 32.5C28.5 35.8 24 39 24 39Z"
        fill="#FF4D79"
        stroke="#4A1525"
        strokeWidth="1.8"
      />
      <path d="M22 28.5L24 30L26 28.5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="33" r="0.8" fill="#FFF3C4" />
      <circle cx="25.2" cy="34.2" r="0.8" fill="#FFF3C4" />
    </g>
    {/* Sparkle Heart */}
    <path
      d="M44 13C44 13 41 11 41 9.2C41 8 42 7.2 43 7.2C43.6 7.2 44 7.6 44 7.6C44 7.6 44.4 7.2 45 7.2C46 7.2 47 8 47 9.2C47 11 44 13 44 13Z"
      fill="#FF4D79"
    />
  </svg>
);

/**
 * Cute Pink Ribbon Bow Topper for Hero Doctor Spotlight Card
 */
export const CuteRibbonBow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    width="64"
    height="34"
    viewBox="0 0 64 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    aria-hidden="true"
  >
    {/* Hanging Ribbon Tails */}
    <path
      d="M26 19L19 31L25 29L28 33L31 20"
      fill="#FF8DA8"
      stroke="#4A1525"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M38 19L45 31L39 29L36 33L33 20"
      fill="#FF8DA8"
      stroke="#4A1525"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Left Bow Loop */}
    <path
      d="M29 14C20 4 6 5 6 14C6 23 20 24 29 16Z"
      fill="#FF4D79"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Right Bow Loop */}
    <path
      d="M35 14C44 4 58 5 58 14C58 23 44 24 35 16Z"
      fill="#FF4D79"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Inner Loop Creases */}
    <path d="M14 14C18 12 22 13 26 15" stroke="#FFE2EE" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 14C46 12 42 13 38 15" stroke="#FFE2EE" strokeWidth="2" strokeLinecap="round" />
    {/* Center Heart Knot */}
    <circle cx="32" cy="15" r="5.5" fill="#FFF3C4" stroke="#4A1525" strokeWidth="2.2" />
    <circle cx="32" cy="15" r="2.2" fill="#FF4D79" />
  </svg>
);

/**
 * Stethoscope & Strawberry Heart Badge for Doctor Spotlight Pill-Cards
 */
export const StethoscopeHeartIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="32" height="32" rx="12" fill="#FFE2EE" stroke="#FBCFE8" strokeWidth="1.8" />
    <path
      d="M11 10V15C11 18.8 14.1 22 18 22C21.9 22 25 18.8 25 15V10"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M18 22V25.5C18 27.4 19.6 29 21.5 29C23.4 29 25 27.4 25 25.5V23"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="25" cy="21.5" r="2.8" fill="#FF4D79" stroke="#4A1525" strokeWidth="1.8" />
    <path
      d="M18 17.5C18 17.5 14.8 15.4 14.8 13.4C14.8 12.2 15.8 11.4 16.9 11.4C17.5 11.4 18 11.8 18 11.8C18 11.8 18.5 11.4 19.1 11.4C20.2 11.4 21.2 12.2 21.2 13.4C21.2 15.4 18 17.5 18 17.5Z"
      fill="#FF4D79"
    />
  </svg>
);

/**
 * Matcha Cloud Cup Icon for Leave / Cuti / LP Rest Days
 */
export const MatchaSleepyCloudIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="20" fill="#DCFCE7" />
    {/* Fluffy Cloud Cushion */}
    <path
      d="M12 36H36C39 36 41.5 33.8 41.5 31C41.5 28.4 39.5 26.2 37 26C36 22 32.5 19 28 19C24.2 19 21 21.3 19.7 24.7C16.2 25 13.5 27.8 13.5 31.2C13.5 34 15.5 36 12 36Z"
      fill="#FFFFFF"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Warm Matcha Tea Cup on Cloud */}
    <path
      d="M18 22H30V29C30 32.3 27.3 35 24 35C20.7 35 18 32.3 18 29V22Z"
      fill="#86EFAC"
      stroke="#4A1525"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    <path d="M30 24H32.5C33.9 24 35 25.1 35 26.5C35 27.9 33.9 29 32.5 29H30" stroke="#4A1525" strokeWidth="2.2" />
    {/* Steam */}
    <path d="M21.5 18C21.5 16.5 22.8 15.5 22.8 14" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    <path d="M26.5 18C26.5 16.5 27.8 15.5 27.8 14" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SparkleStarIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
      fill="#FDE047"
      stroke="#4A1525"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

