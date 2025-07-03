import {
  Col,
  InputNumber,
  InputNumberProps,
  Row,
  Slider,
} from "antd";
import React, { useEffect, useState } from "react";

/**
 * Defines the props for the NumberStep component.
 * It extends Ant Design's InputNumberProps to inherit common number input properties.
 */
interface NumberStepProps extends Omit<InputNumberProps, 'value' | 'onChange' | 'min' | 'max' | 'step' | 'defaultValue'> {
  /**
   * The current value of the number input.
   */
  value?: number;
  /**
   * Callback function triggered when the value changes.
   * @param value The new numeric value.
   */
  onChange?: (value: number | undefined) => void;
  /**
   * The minimum value.
   */
  min?: number;
  /**
   * The maximum value.
   */
  max?: number;
  /**
   * The step size for value changes.
   */
  step?: number;
  /**
   * The default value.
   */
  defaultValue?: number;
}

/**
 * A component that provides a numeric input with an accompanying slider for easy adjustment.
 * It combines Ant Design's Slider and InputNumber components.
 * @param {NumberStepProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered NumberStep component.
 */
export function NumberStep({
  value,
  onChange,
  min,
  max,
  step,
  defaultValue,
  ...restProps
}: NumberStepProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<number | undefined>(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange: InputNumberProps["onChange"] = (newValue) => {
    // Ensure the value is a number, otherwise set to undefined.
    const numericValue = typeof newValue === "number" && !Number.isNaN(newValue) ? newValue : undefined;
    setInputValue(numericValue);
    onChange?.(numericValue);
  };

  return (
    <Row className="w-full">
      <Col span={16}>
        <Slider
          min={min ?? 0}
          max={max ?? 100}
          onChange={handleInputChange}
          value={inputValue ?? 0}
          step={step ?? 1}
          defaultValue={defaultValue ?? 0}
        />
      </Col>
      <Col span={8}>
        <InputNumber
          {...{
            min,
            max,
            style: { margin: "0 16px" },
            step: step as any,
            value: inputValue as any,
            onChange: handleInputChange,
            defaultValue,
            ...(restProps || {})
          }}
        />
      </Col>
    </Row>
  );
}
