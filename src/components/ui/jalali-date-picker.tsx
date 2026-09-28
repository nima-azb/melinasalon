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
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder,
  className,
}: JalaliDatePickerProps) {
  return (
    <DatePicker
      calendar={persian}
      locale={persian_fa}
      value={value ? new Date(value) : ""}
      onChange={(dateObject) => {
        if (
          dateObject &&
          typeof dateObject === "object" &&
          "toDate" in dateObject
        ) {
          // استفاده از تایپ مشخص به جای any برای رفع خطای لینتر
          const gregorianDate = (dateObject as { toDate: () => Date })
            .toDate()
            .toISOString()
            .split("T")[0];
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
