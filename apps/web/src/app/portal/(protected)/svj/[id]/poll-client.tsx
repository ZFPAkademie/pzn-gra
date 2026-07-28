'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { voteSvjPoll } from '../actions';

interface PollSectionProps {
  postId: string;
  options: { key: string; label: string }[];
  counts: Record<string, number>;
  totalVotes: number;
  myVote: string | null;
  deadline: string | null;
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function PollSection({ postId, options, counts, totalVotes, myVote, deadline }: PollSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(myVote);
  const [error, setError] = useState('');

  const deadlinePassed = deadline ? new Date(deadline) < new Date() : false;

  function handleVote(optionKey: string) {
    if (deadlinePassed || isPending) return;
    const previous = selected;
    setSelected(optionKey);
    setError('');
    startTransition(async () => {
      const result = await voteSvjPoll(postId, optionKey);
      if (!result.ok) {
        setSelected(previous);
        setError(result.error ?? 'Hlas se nepodařilo uložit');
        return;
      }
      router.refresh();
    });
  }

  if (options.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-[#0B1626]/10">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-[#0B1626] font-light text-base">Hlasování</h2>
        {deadline && (
          <span className={`text-xs ${deadlinePassed ? 'text-[#0B1626]/30' : 'text-[#0B1626]/50'}`}>
            {deadlinePassed ? 'Ukončeno' : 'Do'} {formatDeadline(deadline)}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          // Optimistický přepočet: hlas přesunut na lokálně vybranou možnost
          let count = counts[option.key] ?? 0;
          if (selected !== myVote) {
            if (option.key === selected) count += 1;
            if (option.key === myVote) count -= 1;
          }
          const total = totalVotes + (selected && !myVote ? 1 : 0);
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isMine = option.key === selected;

          return (
            <button
              key={option.key}
              onClick={() => handleVote(option.key)}
              disabled={deadlinePassed || isPending}
              className={`w-full text-left relative overflow-hidden border rounded-sm px-4 py-3 transition-colors ${
                isMine
                  ? 'border-[#C9A24D] bg-[#C9A24D]/5'
                  : deadlinePassed
                    ? 'border-[#0B1626]/10 cursor-default'
                    : 'border-[#0B1626]/10 hover:border-[#0B1626]/40'
              }`}
            >
              <span
                className="absolute inset-y-0 left-0 bg-[#0B1626]/5"
                style={{ width: `${pct}%` }}
              />
              <span className="relative flex items-center justify-between gap-4">
                <span className={`text-sm font-light ${isMine ? 'text-[#0B1626]' : 'text-[#0B1626]/70'}`}>
                  {option.label}
                  {isMine && <span className="text-[#C9A24D] ml-2 text-xs">Váš hlas</span>}
                </span>
                <span className="text-[#0B1626]/40 text-xs whitespace-nowrap">
                  {count} ({pct} %)
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!deadlinePassed && (
        <p className="text-[#0B1626]/30 text-xs mt-3">
          Stačí zakliknout — hlas se ukládá automaticky. Hlas můžete kdykoli změnit.
        </p>
      )}
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
}
