'use client';

/**
 * CheckInInstructions Component
 * Displays check-in information for guests
 * 
 * Shows: address, access code, parking, WiFi, emergency contact
 */

import { cn } from '@/lib/utils';

interface CheckInInstructionsProps {
  address: string;
  accessCode?: string;
  parkingInfo?: string;
  wifiName?: string;
  wifiPassword?: string;
  emergencyContact?: string;
  checkInTime: string;
  checkOutTime: string;
  locale?: 'cs' | 'en';
  className?: string;
}

export function CheckInInstructions({
  address,
  accessCode,
  parkingInfo,
  wifiName,
  wifiPassword,
  emergencyContact,
  checkInTime,
  checkOutTime,
  locale = 'cs',
  className,
}: CheckInInstructionsProps) {
  const labels = {
    title: locale === 'cs' ? 'Pokyny k check-inu' : 'Check-in Instructions',
    address: locale === 'cs' ? 'Adresa' : 'Address',
    accessCode: locale === 'cs' ? 'Přístupový kód' : 'Access Code',
    checkInTime: locale === 'cs' ? 'Check-in' : 'Check-in',
    checkOutTime: locale === 'cs' ? 'Check-out' : 'Check-out',
    from: locale === 'cs' ? 'od' : 'from',
    until: locale === 'cs' ? 'do' : 'until',
    parking: locale === 'cs' ? 'Parkování' : 'Parking',
    wifi: 'WiFi',
    network: locale === 'cs' ? 'Síť' : 'Network',
    password: locale === 'cs' ? 'Heslo' : 'Password',
    emergency: locale === 'cs' ? 'Nouzový kontakt' : 'Emergency Contact',
    copyCode: locale === 'cs' ? 'Kopírovat kód' : 'Copy code',
    copied: locale === 'cs' ? 'Zkopírováno!' : 'Copied!',
    openMaps: locale === 'cs' ? 'Otevřít v mapách' : 'Open in maps',
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getMapsUrl = (address: string) => {
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {labels.title}
        </h2>
      </div>

      <div className="p-4 space-y-6">
        {/* Address */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">{labels.address}</h3>
          <p className="text-gray-900 font-medium">{address}</p>
          <a
            href={getMapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {labels.openMaps}
          </a>
        </div>

        {/* Access code */}
        {accessCode && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 mb-2">{labels.accessCode}</h3>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold text-blue-900 tracking-wider">
                {accessCode}
              </span>
              <button
                onClick={() => handleCopyCode(accessCode)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {labels.copyCode}
              </button>
            </div>
          </div>
        )}

        {/* Check-in/out times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-green-700">{labels.checkInTime}</h3>
            <p className="text-lg font-semibold text-green-900">
              {labels.from} {checkInTime}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-orange-700">{labels.checkOutTime}</h3>
            <p className="text-lg font-semibold text-orange-900">
              {labels.until} {checkOutTime}
            </p>
          </div>
        </div>

        {/* Parking */}
        {parkingInfo && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              {labels.parking}
            </h3>
            <p className="text-gray-700">{parkingInfo}</p>
          </div>
        )}

        {/* WiFi */}
        {(wifiName || wifiPassword) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              {labels.wifi}
            </h3>
            <div className="space-y-2 text-sm">
              {wifiName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{labels.network}:</span>
                  <span className="font-mono font-medium text-gray-900">{wifiName}</span>
                </div>
              )}
              {wifiPassword && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{labels.password}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900">{wifiPassword}</span>
                    <button
                      onClick={() => handleCopyCode(wifiPassword)}
                      className="text-gray-400 hover:text-gray-600"
                      title={labels.copyCode}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency contact */}
        {emergencyContact && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {labels.emergency}
            </h3>
            <a
              href={`tel:${emergencyContact.replace(/\s/g, '')}`}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {emergencyContact}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckInInstructions;
