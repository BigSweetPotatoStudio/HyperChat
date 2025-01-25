import { Input, Tag } from "antd";
import React, { useEffect, useState } from "react";
export function InputPlus({ value, options, onChange, ...p }: any) {
  const [inputValue, setInputValue] = useState(value);
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  return (
    <div>
      <Input
        {...p}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
        }}
      />
      {options?.map((x) => {
        return (
          <Tag
            className="cursor-pointer"
            key={x.value}
            onClick={() => {
              onChange && onChange(x.value);
            }}
          >
            {x.label}
          </Tag>
        );
      })}
    </div>
  );
}
