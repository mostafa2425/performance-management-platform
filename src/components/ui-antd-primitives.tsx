"use client";

import React from "react";
import { Button, Checkbox, Collapse, Input, Select } from "antd";
import type { ButtonProps, InputProps, TableColumnsType } from "antd";
import { DataTable } from "@/components/ui/data-table";

type NativeButtonProps = Omit<ButtonProps, "type" | "htmlType"> & { type?: "button" | "submit" | "reset"; variant?: ButtonProps["type"] };
export function AppButton({ type = "button", variant, children, className, ...props }: NativeButtonProps) {
  const primary = (className ?? "").split(" ").some((name) => ["primary", "pw-primary", "cfg-primary", "login-submit", "mo-primary"].includes(name));
  return <Button {...props} className={className} type={variant ?? (primary ? "primary" : "default")} htmlType={type}>{children}</Button>;
}

export function AppInput(props: InputProps) {
  return <Input {...props} />;
}
export function AppTextArea(props: React.ComponentProps<typeof Input.TextArea>) {
  return <Input.TextArea {...props} />;
}
export function AppCheckbox({ children, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Checkbox checked={props.checked} defaultChecked={props.defaultChecked} disabled={props.disabled} onChange={props.onChange ? (event) => props.onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>) : undefined}>{children}</Checkbox>;
}

type NativeSelectProps = {
  children?: React.ReactNode;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onChange?: (event: { target: { value: string } }) => void;
};
export function AppSelect({ children, onChange, className, ...props }: NativeSelectProps) {
  const options = React.Children.toArray(children)
    .filter((child): child is React.ReactElement<{ value?: string | number; children?: React.ReactNode; disabled?: boolean }> => React.isValidElement(child))
    .map((child) => ({ value: String(child.props.value ?? child.props.children ?? ""), label: child.props.children, disabled: child.props.disabled }));
  return <Select className={className} value={props.value} defaultValue={props.defaultValue} disabled={props.disabled} placeholder={props.placeholder} showSearch optionFilterProp="label" options={options} onChange={(value) => onChange?.({ target: { value: String(value) } })} />;
}

function sectionChildren(section?: React.ReactElement): React.ReactElement[] {
  if (!section) return [];
  const props = section.props as { children?: React.ReactNode };
  return React.Children.toArray(props.children).filter(React.isValidElement) as React.ReactElement[];
}
export function AppTable({ children, className }: { children?: React.ReactNode; className?: string }) {
  const sections = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];
  const head = sections.find((node) => node.type === "thead");
  const body = sections.find((node) => node.type === "tbody");
  const headerRow = sectionChildren(head)[0];
  const headerCells = headerRow ? React.Children.toArray((headerRow.props as { children?: React.ReactNode }).children).filter(React.isValidElement) as React.ReactElement[] : [];
  const columns: TableColumnsType<Record<string, React.ReactNode>> = headerCells.map((cell, index) => ({
    title: (cell.props as { children?: React.ReactNode }).children,
    dataIndex: `cell_${index}`,
    key: `column_${index}`,
    render: (value) => value
  }));
  const dataSource = sectionChildren(body).filter((row) => row.type === "tr").map((row, rowIndex) => {
    const cells = React.Children.toArray((row.props as { children?: React.ReactNode }).children).filter(React.isValidElement) as React.ReactElement[];
    return Object.fromEntries(cells.map((cell, index) => [`cell_${index}`, (cell.props as { children?: React.ReactNode }).children]).concat([["key", String(rowIndex)]])) as Record<string, React.ReactNode>;
  });
  return <DataTable className={className} size="middle" pagination={false} scroll={{ x: "max-content" }} columns={columns} dataSource={dataSource} rowKey="key" locale={{ emptyText: "—" }} />;
}

export function AppDetails({ children, className, open }: { children?: React.ReactNode; className?: string; open?: boolean }) {
  const nodes = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{ children?: React.ReactNode }>[];
  const summary = nodes.find((node) => node.type === "summary");
  const content = nodes.filter((node) => node.type !== "summary");
  return <Collapse className={className} defaultActiveKey={open ? ["details"] : []} items={[{ key: "details", label: summary?.props.children ?? "Details", children: <>{content}</> }]} />;
}
