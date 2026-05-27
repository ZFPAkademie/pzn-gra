export interface ICalEvent {
  uid: string;
  summary: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (exclusive — iCal DTEND is day after last night)
}

function parseICalDate(value: string): string {
  // Handles: 20260601, 20260601T000000Z, 20260601T000000
  const digits = value.replace(/[TZ]/g, '').slice(0, 8);
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

export function parseICalFeed(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Unfold: lines continued with a space/tab
    .replace(/\n[ \t]/g, '')
    .split('\n');

  let inEvent = false;
  let uid = '';
  let summary = '';
  let startDate = '';
  let endDate = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      uid = '';
      summary = '';
      startDate = '';
      endDate = '';
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (startDate && endDate) {
        events.push({
          uid: uid || `${startDate}__${endDate}`,
          summary,
          startDate,
          endDate,
        });
      }
      continue;
    }
    if (!inEvent) continue;

    // Property name may have parameters: DTSTART;VALUE=DATE:20260601
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const propFull = line.slice(0, colonIdx).toUpperCase();
    const value = line.slice(colonIdx + 1);
    const propName = propFull.split(';')[0];

    if (propName === 'UID') uid = value;
    else if (propName === 'SUMMARY') summary = value;
    else if (propName === 'DTSTART') startDate = parseICalDate(value);
    else if (propName === 'DTEND') endDate = parseICalDate(value);
  }

  return events;
}

// Build an iCal feed from our bookings (for export)
export function buildICalFeed(params: {
  apartmentTitle: string;
  events: Array<{ uid: string; summary: string; startDate: string; endDate: string }>;
}): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

  const vevents = params.events
    .map(
      (e) => `BEGIN:VEVENT
UID:${e.uid}
DTSTAMP:${dtstamp}Z
DTSTART;VALUE=DATE:${e.startDate.replace(/-/g, '')}
DTEND;VALUE=DATE:${e.endDate.replace(/-/g, '')}
SUMMARY:${e.summary}
END:VEVENT`
    )
    .join('\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pod Zlatym navrsim//PZN//CS
X-WR-CALNAME:${params.apartmentTitle}
X-WR-TIMEZONE:Europe/Prague
${vevents}
END:VCALENDAR`;
}
