import { Input, Tag } from "antd";
import React, { useEffect, useState } from "react";
import type { InputProps } from "antd/lib/input";

/**
 * Defines the structure for an option in the InputPlus component.
 */
interface InputPlusOption {
  /**
   * The value associated with the option.
   */
  value: string;
  /**
   * The label displayed for the option.
   */
  label: string;
}

/**
 * Defines the props for the InputPlus component.
 */
interface InputPlusProps extends Omit<InputProps, "onChange" | "value"> {
  /**
   * The current value of the input.
   */
  value?: string;
  /**
   * An array of options to display as clickable tags.
   */
  options?: InputPlusOption[];
  /**
   * Callback function triggered when the input value changes or a tag is clicked.
   * @param value The new value of the input.
   */
  onValueChange?: (value: string) => void;
}

/**
 * A custom input component that combines an Ant Design Input with clickable tags.
 * Clicking a tag will set its value as the input's value.
 * @param {InputPlusProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered InputPlus component.
 */
export function InputPlus({
  value,
  options,
  onValueChange,
  ...restProps
}: InputPlusProps): React.ReactElement {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onValueChange?.(e.target.value);
  };

  const handleTagClick = (tagValue: string) => {
    setInputValue(tagValue);
    onValueChange?.(tagValue);
  };

  return (
    <div>
      <Input {...restProps} value={inputValue} onChange={handleInputChange} />
      {options?.map((option) => (
        <Tag
          className="cursor-pointer"
          key={option.value}
          onClick={() => handleTagClick(option.value)}
        >
          {option.label}
        </Tag>
      ))}
    </div>
  );
}
