'use client';

/**
 * HouseRules Component
 * Displays house rules and apartment information
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HouseRulesProps {
  houseRules?: string;
  apartmentInfo?: string;
  locale?: 'cs' | 'en';
  className?: string;
}

export function HouseRules({
  houseRules,
  apartmentInfo,
  locale = 'cs',
  className,
}: HouseRulesProps) {
  const [expandedSection, setExpandedSection] = useState<'rules' | 'info' | null>('rules');

  const labels = {
    houseRules: locale === 'cs' ? 'Domovní řád' : 'House Rules',
    apartmentInfo: locale === 'cs' ? 'O apartmánu' : 'About the Apartment',
    noRules: locale === 'cs' ? 'Žádná pravidla nejsou k dispozici.' : 'No rules available.',
    noInfo: locale === 'cs' ? 'Žádné informace nejsou k dispozici.' : 'No information available.',
  };

  const toggleSection = (section: 'rules' | 'info') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Parse content - split by newlines for display
  const formatContent = (content: string) => {
    return content.split('\n').filter(line => line.trim());
  };

  const hasRules = houseRules && houseRules.trim().length > 0;
  const hasInfo = apartmentInfo && apartmentInfo.trim().length > 0;

  if (!hasRules && !hasInfo) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden', className)}>
      {/* House Rules Section */}
      {hasRules && (
        <div className="border-b border-gray-200 last:border-b-0">
          <button
            onClick={() => toggleSection('rules')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {labels.houseRules}
            </h2>
            <svg 
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                expandedSection === 'rules' ? 'rotate-180' : ''
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'rules' && (
            <div className="px-4 pb-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {formatContent(houseRules).map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apartment Info Section */}
      {hasInfo && (
        <div>
          <button
            onClick={() => toggleSection('info')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {labels.apartmentInfo}
            </h2>
            <svg 
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                expandedSection === 'info' ? 'rotate-180' : ''
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSection === 'info' && (
            <div className="px-4 pb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-gray-700 space-y-2">
                  {formatContent(apartmentInfo).map((para, index) => (
                    <p key={index}>{para}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HouseRules;
