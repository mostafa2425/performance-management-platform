"use client";

import { Table } from "antd";
import type { TableProps } from "antd";
import type { Key, ReactNode } from "react";

export type DataTableProps<RecordType extends object = Record<string, unknown>> =
  TableProps<RecordType> & {
    /** Optional semantic class for a feature-specific table variant. */
    className?: string;
    /** Accessible label for the table region when the surrounding section has no heading. */
    ariaLabel?: string;
  };

/**
 * Project-wide table entry point.
 *
 * Keeps Ant Design's full table API (sorting, filtering, expandable rows,
 * selection, fixed columns, summaries, pagination, and custom renderers)
 * while applying the shared visual baseline from globals.css.
 * Feature-specific classes may refine layout, but should not redefine the
 * shared typography, surface, border, and spacing tokens.
 */
export function DataTable<RecordType extends object = Record<string, unknown>>({
  className,
  ariaLabel,
  ...props
}: DataTableProps<RecordType>) {
  const classes = ["pmp-data-table", className].filter(Boolean).join(" ");

  return (
    <div className="pmp-data-table-region" aria-label={ariaLabel}>
      <Table<RecordType> {...props} className={classes} />
    </div>
  );
}
