export const SALON_TIMEZONE = "Asia/Tehran";

export const SALON_OPEN_HOUR = 10;
export const SALON_CLOSE_HOUR = 22;
export const SLOT_INTERVAL_MINUTES = 30;

export type ZonedWallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/**
 * The difference (in ms) between "how this instant reads in `timeZone`,
 * interpreted as if it were UTC" and the instant itself. Adding this back
 * lets us go from a UTC instant to the equivalent wall-clock time and vice
 * versa.
 */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  const hour = map.hour === "24" ? 0 : Number(map.hour);

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );

  return asUtc - date.getTime();
}

/**
 * Converts a salon-local wall-clock time (e.g. "2026-09-20 10:00") into the
 * UTC instant it actually represents.
 */
export function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  timeZone: string = SALON_TIMEZONE,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  let utcMillis = utcGuess - offset;

  // Re-check once in case the offset changes right around the guessed
  // instant (relevant for zones with DST; harmless no-op for Iran, which
  // has used a fixed UTC+03:30 offset since 2022).
  const offset2 = getTimeZoneOffsetMs(new Date(utcMillis), timeZone);

  if (offset2 !== offset) {
    utcMillis = utcGuess - offset2;
  }

  return new Date(utcMillis);
}

/**
 * Reads the salon-local wall-clock date/time components for a given UTC
 * instant.
 */
export function getZonedWallTime(
  date: Date,
  timeZone: string = SALON_TIMEZONE,
): ZonedWallTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === "24" ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/**
 * Strictly validates a "YYYY-MM-DD" calendar date string (rejects things
 * like 2026-02-30) without constructing any timezone-sensitive Date object.
 */
export function isValidCalendarDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  if (month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return day >= 1 && day <= daysInMonth;
}

export function parseCalendarDateString(value: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = value.split("-").map(Number);

  return { year, month, day };
}

/**
 * Given a "YYYY-MM-DD" salon-local calendar date, returns the UTC instants
 * for the start/end of that calendar day and for salon opening/closing time.
 */
export function getSalonDayBounds(dateString: string) {
  const { year, month, day } = parseCalendarDateString(dateString);

  return {
    startOfDay: zonedWallTimeToUtc(year, month, day, 0, 0, 0),
    endOfDay: zonedWallTimeToUtc(year, month, day + 1, 0, 0, 0),
    dayOpen: zonedWallTimeToUtc(year, month, day, SALON_OPEN_HOUR, 0, 0),
    dayClose: zonedWallTimeToUtc(year, month, day, SALON_CLOSE_HOUR, 0, 0),
  };
}

/**
 * True when the instant falls exactly on a salon-local `SLOT_INTERVAL_MINUTES`
 * boundary (e.g. :00 or :30) with no leftover seconds/milliseconds.
 */
export function isSlotAligned(date: Date): boolean {
  if (date.getTime() % 1000 !== 0) {
    return false;
  }

  const wall = getZonedWallTime(date);

  return wall.minute % SLOT_INTERVAL_MINUTES === 0 && wall.second === 0;
}

/**
 * True when [start, end) falls entirely within the same salon-local calendar
 * day and within salon opening hours. Explicitly rejects the case where a
 * long service duration pushes `end` past midnight into the next calendar
 * day (hour-of-day alone can't detect that, since it wraps back to small
 * numbers after midnight).
 */
export function isWithinSalonHours(start: Date, end: Date): boolean {
  if (end <= start) {
    return false;
  }

  const startWall = getZonedWallTime(start);
  const endWall = getZonedWallTime(end);

  const sameCalendarDay =
    startWall.year === endWall.year &&
    startWall.month === endWall.month &&
    startWall.day === endWall.day;

  if (!sameCalendarDay) {
    return false;
  }

  const startMinutes = startWall.hour * 60 + startWall.minute;
  const endMinutes = endWall.hour * 60 + endWall.minute;

  return (
    startMinutes >= SALON_OPEN_HOUR * 60 && endMinutes <= SALON_CLOSE_HOUR * 60
  );
}
