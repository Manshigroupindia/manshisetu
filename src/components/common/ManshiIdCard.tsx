import React, { useState } from 'react';
import { Staff } from '../../types';
import { getCanonicalEmployeeId } from '../../utils/firestoreUtils';
import { Printer, Eye, Layers } from 'lucide-react';

interface ManshiIdCardProps {
  staff: Staff;
  showControls?: boolean;
  className?: string;
  defaultSide?: 'both' | 'front' | 'back';
}

/**
 * Format date from YYYY-MM-DD or any standard string into DD-MM-YYYY
 */
function formatDisplayDate(dateStr?: string, fallback = '20-03-1989'): string {
  if (!dateStr) return fallback;
  const trimmed = dateStr.trim();
  // If already DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }
  // If YYYY-MM-DD
  const match = trimmed.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}-${m}-${y}`;
  }
  return fallback;
}

/**
 * Generate employee initials for ID No format (e.g. Rani Yadav -> RY)
 */
function getEmployeeInitials(name?: string): string {
  if (!name) return 'EMP';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Compute default expiry date (e.g. 31-03-2027)
 */
function computeExpiryDate(joiningDateStr?: string, customExpiry?: string): string {
  if (customExpiry) return formatDisplayDate(customExpiry, '31-03-2027');
  if (joiningDateStr) {
    const formatted = formatDisplayDate(joiningDateStr, '');
    if (formatted) {
      const parts = formatted.split('-');
      if (parts.length === 3) {
        const joinYear = parseInt(parts[2], 10);
        const expireYear = isNaN(joinYear) ? 2027 : joinYear + 1;
        return `31-03-${expireYear}`;
      }
    }
  }
  return '31-03-2027';
}

/**
 * =======================================================================
 * FRONT SIDE OF MANSHI GROUP OF SERVICES ID CARD
 * Exact recreation of id-front.jpeg (Dimensions: 360px x 571px)
 * =======================================================================
 */
export const ManshiIdCardFront: React.FC<{ staff: Staff }> = ({ staff }) => {
  const cleanId = getCanonicalEmployeeId(staff.employeeId, staff.id) || '010';
  // Use numeric part or clean ID for the ID NO field (e.g. 010 from MGS-010 or 010)
  const idNumber = cleanId.replace(/^MGS[-_]?/i, '') || cleanId;
  const dobStr = formatDisplayDate(staff.dob, '20-03-1989');
  const joinStr = formatDisplayDate(staff.joiningDate, '06-10-2026');
  const expireStr = computeExpiryDate(staff.joiningDate, staff.expiryDate);
  const designation = staff.designation || 'Business Partner';

  return (
    <div
      className="id-card-wrapper relative bg-white text-[#1f242d] select-none overflow-hidden print-break-inside-avoid shadow-2xl"
      style={{
        width: '360px',
        height: '571px',
        minWidth: '360px',
        minHeight: '571px',
        maxWidth: '360px',
        maxHeight: '571px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
    >
      {/* ================================================================ */}
      {/* TOP HEADER: DARK CHARCOAL + VIBRANT RED WAVE SHAPES             */}
      {/* ================================================================ */}
      <div className="absolute top-0 left-0 right-0 z-0">
        <svg
          width="360"
          height="195"
          viewBox="0 0 360 195"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
        >
          {/* Layer 1: Vibrant Red Ribbon Wave */}
          <path
            d="M 0,0 L 360,0 L 360,190 Q 180,154 0,190 Z"
            fill="#e51a24"
          />

          {/* Layer 2: Dark Charcoal Header with Downward Center Curve */}
          <path
            d="M 0,0 L 360,0 L 360,118 Q 180,146 0,118 Z"
            fill="#232731"
          />

          {/* Heading Text: Manshi Group */}
          <text
            x="180"
            y="56"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Roboto Slab', 'Noto Serif', Rockwell, serif"
            fontWeight="900"
            fontSize="26.5"
            letterSpacing="-0.3"
          >
            Manshi Group
          </text>

          {/* Heading Text: Of Services */}
          <text
            x="180"
            y="94"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Roboto Slab', 'Noto Serif', Rockwell, serif"
            fontWeight="900"
            fontSize="26.5"
            letterSpacing="-0.3"
          >
            Of Services
          </text>
        </svg>
      </div>

      {/* ================================================================ */}
      {/* CIRCULAR PROFILE PHOTO (Centered with 4px red border)           */}
      {/* ================================================================ */}
      <div
        className="absolute z-10 left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          top: '165px',
          width: '118px',
          height: '118px',
        }}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shadow-md"
          style={{
            border: '4.5px solid #e51a24',
          }}
        >
          {staff.avatarUrl ? (
            <img
              src={staff.avatarUrl}
              alt={staff.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If avatar image fails to load, fallback to initial
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 flex items-center justify-center font-id-slab font-black text-3xl text-[#232731]">
              {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'M'}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================ */}
      {/* EMPLOYEE NAME & DESIGNATION                                     */}
      {/* ================================================================ */}
      <div
        className="absolute left-0 right-0 z-10 text-center px-4"
        style={{ top: '294px' }}
      >
        {/* Full Name */}
        <h2
          className="font-id-slab font-black text-[#1f242d] tracking-tight leading-none"
          style={{ fontSize: '22px' }}
        >
          {staff.fullName || 'Rani Yadav'}
        </h2>

        {/* Designation in Red Parentheses */}
        <p
          className="font-id-slab font-bold text-[#e51a24] mt-1.5 leading-none"
          style={{ fontSize: '13.5px' }}
        >
          ({designation})
        </p>
      </div>

      {/* ================================================================ */}
      {/* DETAILS GRID (Left Indented, Colons Aligned, Exact Spacing)     */}
      {/* ================================================================ */}
      <div
        className="absolute z-10"
        style={{
          top: '352px',
          left: '68px',
          right: '28px',
          fontFamily: "'Roboto Slab', 'Noto Serif', Rockwell, serif",
        }}
      >
        <div className="space-y-2 text-[#1f242d] font-bold" style={{ fontSize: '13px', lineHeight: '1.4' }}>
          {/* Row 1: ID NO */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">ID NO</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold">{idNumber}</span>
          </div>

          {/* Row 2: DOB */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">DOB</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold">{dobStr}</span>
          </div>

          {/* Spacing Gap */}
          <div className="h-1.5" />

          {/* Row 3: Phone */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">Phone</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold font-mono tracking-tight">{staff.contactNumber || '8929688014'}</span>
          </div>

          {/* Row 4: Email */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">Email</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold truncate text-[11.5px]" title={staff.officialEmail || 'raniyadav1530@gmail.com'}>
              {staff.officialEmail || 'raniyadav1530@gmail.com'}
            </span>
          </div>

          {/* Spacing Gap */}
          <div className="h-1.5" />

          {/* Row 5: Join */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">Join</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold">{joinStr}</span>
          </div>

          {/* Row 6: Expire */}
          <div className="flex items-center">
            <span className="w-[62px] tracking-wide">Expire</span>
            <span className="font-bold text-[#1f242d]">:</span>
            <span className="ml-1 font-bold">{expireStr}</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* BOTTOM FOOTER WAVE: RED LAYER + DARK CHARCOAL CENTER BASE MOUND */}
      {/* ================================================================ */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg
          width="360"
          height="70"
          viewBox="0 0 360 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
        >
          {/* Layer 1: Red Wave Swooping Down Towards Bottom Center */}
          <path
            d="M 0,2 Q 180,34 360,2 L 360,70 L 0,70 Z"
            fill="#e51a24"
          />

          {/* Layer 2: Dark Charcoal Center Mound at Bottom Edge */}
          <path
            d="M 68,70 Q 180,42 292,70 Z"
            fill="#232731"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * =======================================================================
 * BACK SIDE OF MANSHI GROUP OF SERVICES ID CARD
 * Exact recreation of id-back.jpeg (Dimensions: 360px x 571px)
 * =======================================================================
 */
export const ManshiIdCardBack: React.FC<{ staff: Staff }> = ({ staff }) => {
  const cleanId = getCanonicalEmployeeId(staff.employeeId, staff.id) || '010';
  const idNumber = cleanId.replace(/^MGS[-_]?/i, '') || cleanId;
  const initials = getEmployeeInitials(staff.fullName || 'Rani Yadav');
  const fullIdString = `MGS/${initials}/${idNumber}`;
  const phone = staff.contactNumber || '8929688014';

  return (
    <div
      className="id-card-wrapper relative bg-white text-[#1f242d] select-none overflow-hidden print-break-inside-avoid shadow-2xl"
      style={{
        width: '360px',
        height: '571px',
        minWidth: '360px',
        minHeight: '571px',
        maxWidth: '360px',
        maxHeight: '571px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
    >
      {/* ================================================================ */}
      {/* TOP WAVE: RED LAYER + DARK CHARCOAL CREST AT TOP CENTER         */}
      {/* ================================================================ */}
      <div className="absolute top-0 left-0 right-0 z-0">
        <svg
          width="360"
          height="68"
          viewBox="0 0 360 68"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
        >
          {/* Layer 1: Vibrant Red Wave */}
          <path
            d="M 0,0 L 360,0 L 360,65 Q 180,40 0,65 Z"
            fill="#e51a24"
          />

          {/* Layer 2: Dark Charcoal Crest Hanging Down at Top Center */}
          <path
            d="M 68,0 Q 180,26 292,0 Z"
            fill="#232731"
          />
        </svg>
      </div>

      {/* ================================================================ */}
      {/* TOP INFO ROW: ID No & Mob No                                    */}
      {/* ================================================================ */}
      <div
        className="absolute left-0 right-0 z-10 flex items-center justify-between px-6"
        style={{
          top: '74px',
          fontFamily: "'Roboto Slab', 'Noto Serif', Rockwell, serif",
        }}
      >
        <span className="font-black text-[#1f242d] tracking-tight" style={{ fontSize: '13px' }}>
          ID No: {fullIdString}
        </span>
        <span className="font-black text-[#1f242d] tracking-tight" style={{ fontSize: '13px' }}>
          Mob No: {phone}
        </span>
      </div>

      {/* ================================================================ */}
      {/* "आवश्यक सूचना" PILL BADGE                                       */}
      {/* ================================================================ */}
      <div className="absolute left-0 right-0 z-10 flex justify-center" style={{ top: '106px' }}>
        <div
          className="rounded-lg flex items-center justify-center shadow-xs"
          style={{
            backgroundColor: '#542024',
            padding: '3.5px 22px',
          }}
        >
          <span
            className="font-id-hindi font-black text-white tracking-wider"
            style={{ fontSize: '14.5px', lineHeight: '1.2' }}
          >
            आवश्यक सूचना
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* WATERMARK BACKGROUND EMBLEM (Cyan Ring + Faint Red Text)        */}
      {/* ================================================================ */}
      <div
        className="absolute pointer-events-none flex items-center justify-center z-5"
        style={{
          top: '140px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '230px',
          height: '230px',
          opacity: 0.28,
        }}
      >
        <svg width="230" height="230" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Circular Cyan/Blue Seal */}
          <circle cx="100" cy="100" r="74" stroke="#38bdf8" strokeWidth="15" />
          {/* Faint Red Logo Text */}
          <text
            x="100"
            y="78"
            textAnchor="middle"
            fontFamily="'Roboto Slab', 'Noto Serif', serif"
            fontWeight="900"
            fontSize="16.5"
            fill="#e11d48"
          >
            Manshi Group
          </text>
          <text
            x="100"
            y="102"
            textAnchor="middle"
            fontFamily="'Roboto Slab', 'Noto Serif', serif"
            fontWeight="900"
            fontSize="17.5"
            fill="#e11d48"
          >
            Of Services
          </text>
          <text
            x="100"
            y="122"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="8"
            fill="#f43f5e"
            letterSpacing="0.4"
          >
            Business & N.G.O Helping Hand
          </text>
        </svg>
      </div>

      {/* ================================================================ */}
      {/* 6 HINDI INSTRUCTION POINTS (Numbered, Exact Red Highlights)      */}
      {/* ================================================================ */}
      <div
        className="absolute left-0 right-0 z-10 px-5 space-y-1.5 font-id-hindi"
        style={{
          top: '142px',
          fontSize: '10.5px',
          lineHeight: '1.34',
        }}
      >
        {/* Point 1 (Black) */}
        <p className="text-[#1f242d] font-bold text-justify">
          <span className="font-extrabold mr-1">1.</span>
          यह परिचय पत्र मान्शी ग्रुप ऑफ सर्विसेज की सम्पति है इस परिचय पत्र के खो जाने पर तुरंत स्थानीय कार्यालय व स्थानीय पुलिस थाने को सूचित करें ।
        </p>

        {/* Point 2 (Vibrant Red) */}
        <p className="text-[#e51a24] font-black text-justify">
          <span className="font-black mr-1">2.</span>
          परिचय पत्र धारक को संबंधित समाचार और फोटोग्राफर संकलन में सहयोग प्रदान करें ।
        </p>

        {/* Point 3 (Black) */}
        <p className="text-[#1f242d] font-bold text-justify">
          <span className="font-extrabold mr-1">3.</span>
          परिचय पत्र धारक को क्षेत्रीय थाना अधिकारी कृपया जान माल की सुरक्षा प्रदान करते हुए सहयोग देने का कष्ट करें ।
        </p>

        {/* Point 4 (Vibrant Red) */}
        <p className="text-[#e51a24] font-black text-justify">
          <span className="font-black mr-1">4.</span>
          परिचय पत्र का दुरुपयोग न करें अन्यथा स्वयं जिम्मेदार होंगे ।
        </p>

        {/* Point 5 (Black) */}
        <p className="text-[#1f242d] font-bold text-justify">
          <span className="font-extrabold mr-1">5.</span>
          किसी भी असंवैधानिक अथवा अनैतिक कार्यों में सम्मिलित पाए जाने पर परिचय पत्र तत्काल प्रभाव से स्वयं निरस्त माना जाएगा और हमारी कोई भी जिम्मेदारी नहीं होगी ।
        </p>

        {/* Point 6 (Vibrant Red) */}
        <p className="text-[#e51a24] font-black text-justify">
          <span className="font-black mr-1">6.</span>
          परिचय पत्र वैधता अवधि तक ही मान्य होगा ।
        </p>
      </div>

      {/* ================================================================ */}
      {/* HORIZONTAL SOLID DIVIDER RULE                                   */}
      {/* ================================================================ */}
      <div
        className="absolute left-6 right-6 z-10"
        style={{
          top: '369px',
          height: '2px',
          backgroundColor: '#1f242d',
        }}
      />

      {/* ================================================================ */}
      {/* HEAD OFFICE SECTION                                             */}
      {/* ================================================================ */}
      <div
        className="absolute left-0 right-0 z-10 text-center"
        style={{ top: '376px' }}
      >
        <span
          className="font-id-slab font-black uppercase tracking-wider text-[#542024] inline-block border-b-2 border-[#542024] pb-0.5"
          style={{ fontSize: '18px' }}
        >
          HEAD OFFICE
        </span>
      </div>

      {/* ================================================================ */}
      {/* CONTACT DETAILS: Address, Email, Website, Helpline               */}
      {/* ================================================================ */}
      <div
        className="absolute left-0 right-0 z-10 px-6 font-id-slab"
        style={{
          top: '408px',
          fontSize: '11px',
          lineHeight: '1.25',
        }}
      >
        {/* Row 1: Address */}
        <div className="flex items-start mb-2">
          <span className="text-[#e51a24] font-extrabold w-[78px] shrink-0" style={{ fontSize: '12.5px' }}>
            Address
          </span>
          <span className="font-bold text-[#1f242d] mr-2" style={{ fontSize: '12.5px' }}>:</span>
          <div className="text-[#1f242d] font-bold" style={{ fontSize: '10.5px', lineHeight: '1.2' }}>
            Office No.2 B, 2nd Floor, Bhawani Market<br />
            Near Noida Sec-18 Metro Station Gate No. 1
          </div>
        </div>

        {/* Row 2: Email Id */}
        <div className="flex items-center mb-1.5">
          <span className="text-[#e51a24] font-extrabold w-[78px] shrink-0" style={{ fontSize: '12.5px' }}>
            Email Id
          </span>
          <span className="font-bold text-[#1f242d] mr-2" style={{ fontSize: '12.5px' }}>:</span>
          <a
            href="mailto:manshigroupindia@gmail.com"
            className="text-[#1a3db8] font-bold underline truncate text-[11.5px]"
          >
            manshigroupindia@gmail.com
          </a>
        </div>

        {/* Row 3: Website */}
        <div className="flex items-center mb-2">
          <span className="text-[#e51a24] font-extrabold w-[78px] shrink-0" style={{ fontSize: '12.5px' }}>
            Website
          </span>
          <span className="font-bold text-[#1f242d] mr-2" style={{ fontSize: '12.5px' }}>:</span>
          <a
            href="https://www.manshigroup.in"
            target="_blank"
            rel="noreferrer"
            className="text-[#1a3db8] font-bold underline text-[11.5px]"
          >
            www.manshigroup.in
          </a>
        </div>

        {/* Row 4: Helpline No */}
        <div className="flex items-center pt-0.5">
          <span className="text-[#1f242d] font-extrabold" style={{ fontSize: '13px' }}>
            Helpline No:
          </span>
          <span className="text-[#1f242d] font-black tracking-wider ml-4" style={{ fontSize: '16px' }}>
            8076187274
          </span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* BOTTOM FOOTER WAVE: RED LAYER + DARK CHARCOAL BASE MOUND        */}
      {/* ================================================================ */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg
          width="360"
          height="70"
          viewBox="0 0 360 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
        >
          {/* Layer 1: Red Wave Swooping Down Towards Bottom Center */}
          <path
            d="M 0,2 Q 180,34 360,2 L 360,70 L 0,70 Z"
            fill="#e51a24"
          />

          {/* Layer 2: Dark Charcoal Center Mound at Bottom Edge */}
          <path
            d="M 68,70 Q 180,42 292,70 Z"
            fill="#232731"
          />
        </svg>
      </div>
    </div>
  );
};

/**
 * =======================================================================
 * COMBINED MANSHI ID CARD COMPONENT WITH SIDE CONTROLS & PRINT ACTION
 * =======================================================================
 */
export const ManshiIdCard: React.FC<ManshiIdCardProps> = ({
  staff,
  showControls = true,
  className = '',
  defaultSide = 'both',
}) => {
  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>(defaultSide);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Controls Bar (Hidden during print) */}
      {showControls && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-navy-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-navy-700">
          <div className="flex items-center gap-1.5 bg-white dark:bg-navy-900 p-1 rounded-xl shadow-xs border border-slate-200 dark:border-navy-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveSide('both')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSide === 'both'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Both Sides</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSide === 'front'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Front Side</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeSide === 'back'
                  ? 'bg-slate-900 text-white shadow-xs dark:bg-blue-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Back Side</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-xs shadow-md shadow-red-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print ID Card / Save PDF</span>
          </button>
        </div>
      )}

      {/* ID Cards Display Container */}
      <div className="id-card-print-container flex flex-wrap items-center justify-center gap-6 py-2">
        {/* Front Card (rendered on screen if both or front, ALWAYS rendered in print) */}
        <div className={activeSide === 'back' ? 'hidden print:block' : 'block'}>
          <div className="text-center mb-2 no-print text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Front Side
          </div>
          <ManshiIdCardFront staff={staff} />
        </div>

        {/* Back Card (rendered on screen if both or back, ALWAYS rendered in print) */}
        <div className={activeSide === 'front' ? 'hidden print:block' : 'block'}>
          <div className="text-center mb-2 no-print text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Back Side
          </div>
          <ManshiIdCardBack staff={staff} />
        </div>
      </div>
    </div>
  );
};
