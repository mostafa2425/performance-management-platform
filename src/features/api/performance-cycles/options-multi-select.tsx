"use client";

import { Button, Divider, Empty, Select, Space, Typography } from "antd";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

export type SelectOption = {
  value: string | number;
  label: string;
};

type Props = {
  value?: Array<string | number>;
  onChange?: (value: Array<string | number>) => void;
  options: SelectOption[];
  loading?: boolean;
  disabled?: boolean;
  disabledValues?: Array<string | number>;
  placeholder?: string;
  emptyText?: string;
};

export function OptionsMultiSelect({
  value = [],
  onChange,
  options,
  loading,
  disabled,
  disabledValues = [],
  placeholder,
  emptyText,
}: Props) {
  const t = useTranslations("PerformanceCycles");
  const disabledSet = useMemo(() => new Set(disabledValues.map(String)), [disabledValues]);

  const selectableOptions = useMemo(
    () =>
      options.map((opt) => ({
        ...opt,
        disabled: disabledSet.has(String(opt.value)),
      })),
    [options, disabledSet],
  );

  const selectableValues = useMemo(
    () => selectableOptions.filter((o) => !o.disabled).map((o) => o.value),
    [selectableOptions],
  );

  const selectedCount = value.length;
  const totalSelectable = selectableValues.length;
  const allSelected =
    totalSelectable > 0 && selectableValues.every((v) => value.map(String).includes(String(v)));

  const filterOption = (input: string, option?: SelectOption) => {
    const q = input.trim().toLowerCase();
    if (!q) return true;
    return String(option?.label ?? "").toLowerCase().includes(q);
  };

  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      options={selectableOptions}
      loading={loading}
      disabled={disabled}
      allowClear
      showSearch
      filterOption={filterOption}
      optionFilterProp="label"
      placeholder={placeholder}
      listHeight={280}
      virtual
      popupMatchSelectWidth
      maxTagCount="responsive"
      maxTagTextLength={28}
      maxTagPlaceholder={(omitted) => (
        <Typography.Text type="secondary">+{omitted.length}</Typography.Text>
      )}
      notFoundContent={
        loading ? null : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText ?? t("scope.noOptions")} />
        )
      }
      optionLabelProp="label"
      prefix={
        selectedCount > 0 ? (
          <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            {t("scope.selectedCount", { count: selectedCount, total: options.length })}
          </Typography.Text>
        ) : undefined
      }
      popupRender={(menu) => (
        <>
          <div style={{ padding: "8px 12px 4px" }}>
            <Space size={8} wrap style={{ width: "100%", justifyContent: "space-between" }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t("scope.selectedCount", { count: selectedCount, total: options.length })}
              </Typography.Text>
              <Space size={4}>
                <Button
                  type="link"
                  size="small"
                  disabled={allSelected || totalSelectable === 0}
                  onClick={() =>
                    onChange?.(
                      Array.from(
                        new Set([...value.filter((v) => !disabledSet.has(String(v))), ...selectableValues]),
                      ),
                    )
                  }
                >
                  {t("scope.selectAll")}
                </Button>
                <Button type="link" size="small" danger disabled={selectedCount === 0} onClick={() => onChange?.([])}>
                  {t("scope.clearAll")}
                </Button>
              </Space>
            </Space>
          </div>
          <Divider style={{ margin: "4px 0 8px" }} />
          {menu}
        </>
      )}
    />
  );
}
