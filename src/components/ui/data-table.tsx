"use client";

import { Table } from "antd";
import type { TableProps } from "antd";

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
  size = "middle",
  rowKey,
  ...props
}: DataTableProps<RecordType>) {
  const classes = ["pmp-data-table", className].filter(Boolean).join(" ");
  const isLoading = Boolean(props.loading);
  // Ant Design deprecated the optional index argument for functional rowKey.
  // Wrap callbacks with a single-argument function so callers cannot depend on it.
  const safeRowKey = typeof rowKey === "function"
    ? (record: RecordType) => rowKey(record)
    : rowKey;
  const pagination = props.pagination === false ? false : {
    hideOnSinglePage: true,
    ...(typeof props.pagination === "object" ? props.pagination : {}),
  };

  return (
    <div className="pmp-data-table-region" role={ariaLabel ? "region" : undefined} aria-label={ariaLabel} aria-busy={isLoading}>
      <Table<RecordType> size={size} {...props} rowKey={safeRowKey} pagination={pagination} className={classes} />
    </div>
  );
}
