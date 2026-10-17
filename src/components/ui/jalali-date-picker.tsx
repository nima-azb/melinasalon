"use client";

import React from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface JalaliDatePickerProps {
  value?: string | Date | null;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date | string | number | null;
  maxDate?: Date | string | number | null;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder,
  className,
  minDate,
  maxDate,
}: JalaliDatePickerProps) {
  const parsedValue = React.useMemo(() => {
    if (!value) return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T12:00:00`);
    }
    return new Date(value);
  }, [value]);

  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={parsedValue}
      minDate={minDate ?? undefined}
      maxDate={maxDate ?? undefined}
      containerClassName="w-full"
      onChange={(dateObject) => {
        if (
          dateObject &&
          typeof dateObject === "object" &&
          "toDate" in dateObject
        ) {
          const date = (dateObject as { toDate: () => Date }).toDate();
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const gregorianDate = `${year}-${month}-${day}`;

          onChange(gregorianDate);
        } else {
          onChange("");
        }
      }}
      placeholder={placeholder || "انتخاب تاریخ"}
      inputClass={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        className || ""
      }`}
    />
  );
}
