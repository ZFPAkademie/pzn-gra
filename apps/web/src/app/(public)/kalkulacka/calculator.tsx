'use client';

/**
 * Investment Calculator - Interactive slider-based calculator
 * Based on original design from podzlatymnavrsim.cz
 */

import { useState, useMemo } from 'react';

// Slider component
function Slider({
  label,
  labelEn,
  value,
  onChange,
  min,
  max,
  step,
  format,
  tooltip,
}: {
  label: string;
  labelEn?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  tooltip?: string;
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Generate tick marks
  const ticks = [];
  const tickCount = Math.min(10, (max - min) / step);
  const tickStep = (max - min) / tickCount;
  for (let i = 0; i <= tickCount; i++) {
    ticks.push(min + i * tickStep);
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-navy font-medium">{label}</span>
        {labelEn && <span className="text-navy/40">/ {labelEn}</span>}
        {tooltip && (
          <div className="group relative">
            <svg className="w-4 h-4 text-navy/30 cursor-help" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      
      <div className="relative">
        {/* Track background */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-navy/10 rounded-full" />
        
        {/* Track fill */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-navy rounded-full"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-navy
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-navy
            [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>
      
      {/* Ticks */}
      <div className="flex justify-between mt-2 text-xs text-navy/40">
        {ticks.map((tick, i) => (
          <span key={i}>{format(tick)}</span>
        ))}
      </div>
    </div>
  );
}

// Result row component
function ResultRow({
  label,
  labelEn,
  value,
  highlight = false,
}: {
  label: string;
  labelEn?: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`py-4 ${highlight ? '' : 'border-b border-navy/10'}`}>
      <p className="text-sm text-navy/60 mb-1">
        {label}
        {labelEn && <span className="text-navy/40"> / {labelEn}</span>}
      </p>
      <p className={`text-2xl md:text-3xl font-light ${highlight ? 'text-gold' : 'text-gold'}`}>
        {value}
      </p>
    </div>
  );
}

export function InvestmentCalculator() {
  // Slider states
  const [apartmentPrice, setApartmentPrice] = useState(8790000);
  const [ownInvestment, setOwnInvestment] = useState(80);
  const [occupancy, setOccupancy] = useState(50);
  const [pricePerNight, setPricePerNight] = useState(3500);

  // Calculated values
  const results = useMemo(() => {
    const ownInvestmentAmount = apartmentPrice * (ownInvestment / 100);
    const mortgageAmount = apartmentPrice - ownInvestmentAmount;
    
    const daysPerYear = 365;
    const occupiedDays = daysPerYear * (occupancy / 100);
    const revenuePerYear = occupiedDays * pricePerNight;
    const revenuePerMonth = revenuePerYear / 12;
    
    // Rentier service cost - approximately 200,000 CZK/year or ~31.5% of revenue
    const rentierCost = 200000;
    const revenueAfterRentier = Math.max(0, revenuePerYear - rentierCost);
    const monthlyAfterRentier = revenueAfterRentier / 12;

    return {
      mortgageAmount,
      revenuePerYear,
      revenuePerMonth,
      revenueAfterRentier,
      monthlyAfterRentier,
    };
  }, [apartmentPrice, ownInvestment, occupancy, pricePerNight]);

  // Format helpers
  const formatCZK = (n: number) => new Intl.NumberFormat('cs-CZ').format(Math.round(n));
  const formatPrice = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace('.0', '')} mil`;
    return formatCZK(n);
  };

  return (
    <div className="bg-white p-8 md:p-12 shadow-xl">
      {/* Sliders */}
      <div className="mb-12">
        <Slider
          label="Cena apartmán"
          labelEn="Apartment price (CZK)"
          value={apartmentPrice}
          onChange={setApartmentPrice}
          min={5690000}
          max={13990000}
          step={100000}
          format={formatPrice}
          tooltip="Cena apartmánu včetně DPH"
        />

        <Slider
          label="Vlastní investice v %"
          labelEn="Own investment in %"
          value={ownInvestment}
          onChange={setOwnInvestment}
          min={20}
          max={100}
          step={5}
          format={(v) => `${v}`}
          tooltip="Procento z ceny hrazené z vlastních prostředků"
        />

        <Slider
          label="Obsazenost"
          labelEn="Occupancy"
          value={occupancy}
          onChange={setOccupancy}
          min={30}
          max={90}
          step={5}
          format={(v) => `${v}`}
          tooltip="Předpokládaná roční obsazenost apartmánu"
        />

        <Slider
          label="Cena za noc"
          labelEn="Price per night"
          value={pricePerNight}
          onChange={setPricePerNight}
          min={2500}
          max={6500}
          step={250}
          format={formatCZK}
          tooltip="Průměrná cena za noc v Kč"
        />
      </div>

      {/* Results */}
      <div className="border-t border-navy/10 pt-8">
        <ResultRow
          label="Výše hypotéky (cena suite - vlastní investice)"
          value={`${formatCZK(results.mortgageAmount)} Kč`}
        />
        
        <ResultRow
          label="Tržba za rok"
          labelEn="Revenue per year"
          value={`${formatCZK(results.revenuePerYear)} CZK`}
        />
        
        <ResultRow
          label="Tržby za měsíc"
          labelEn="Monthly revenue"
          value={`${formatCZK(results.revenuePerMonth)} CZK`}
        />
        
        <ResultRow
          label="Tržby po zaplacení služby Rentier (servis & marketing)"
          labelEn="Revenue after payment of Rentier service (service & marketing)"
          value={`${formatCZK(results.revenueAfterRentier)} CZK`}
        />
        
        <ResultRow
          label="Měsíční tržby po zaplacení služby Rentier (servis & marketing)"
          labelEn="Monthly sales after paying for the Rentier service (service & marketing)"
          value={`${formatCZK(results.monthlyAfterRentier)} CZK`}
          highlight
        />
      </div>
    </div>
  );
}
