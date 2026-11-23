"use client";

import type { ComponentProps } from "react";
import { DatePicker } from "antd";
import type { DatePickerProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

type Props = Omit<DatePickerProps, "value" | "onChange"> & {
  value?: string | Dayjs | null;
  onChange?: (value: string | null) => void;
};

/** Ant Design DatePicker that stores `YYYY-MM-DD` strings for API forms. */
export function FormDatePicker({ value, onChange, style, ...props }: Props) {
  const parsed = !value ? null : dayjs.isDayjs(value) ? value : dayjs(value);
  return (
    <DatePicker
      {...props}
      style={{ width: "100%", ...style }}
      value={parsed && parsed.isValid() ? parsed : null}
      onChange={(next) => onChange?.(next ? next.format("YYYY-MM-DD") : null)}
    />
  );
}

type RangeProps = Omit<ComponentProps<typeof DatePicker.RangePicker>, "value" | "onChange"> & {
  value?: [string, string] | null;
  onChange?: (value: [string, string] | null) => void;
};

/** Range picker that stores `[YYYY-MM-DD, YYYY-MM-DD]` for form fields. */
export function FormDateRangePicker({ value, onChange, style, ...props }: RangeProps) {
  const parsed =
    value?.[0] && value?.[1]
      ? ([dayjs(value[0]), dayjs(value[1])] as [Dayjs, Dayjs])
      : null;

  return (
    <DatePicker.RangePicker
      {...props}
      style={{ width: "100%", ...style }}
      value={parsed}
      onChange={(next) =>
        onChange?.(
          next?.[0] && next?.[1]
            ? [next[0].format("YYYY-MM-DD"), next[1].format("YYYY-MM-DD")]
            : null,
        )
      }
    />
  );
}
