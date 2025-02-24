import {
  Col,
  Input,
  InputNumber,
  InputNumberProps,
  Row,
  Slider,
  Tag,
} from "antd";
import React, { useEffect, useState } from "react";
export function NumberStep(props: any) {
  const [inputValue, setInputValue] = useState(props.value);

  const onChange: InputNumberProps["onChange"] = (value) => {
    if (Number.isNaN(value)) {
      return;
    }
    let v = typeof value === "number" ? value : undefined;
    setInputValue(v);
    props.onChange && props.onChange(v);
  };

  return (
    <Row className="w-full">
      <Col span={18}>
        <Slider
          defaultValue={props.defaultValue}
          min={props.min}
          max={props.max}
          onChange={onChange}
          value={inputValue}
          step={props.step}
        />
      </Col>
      <Col span={6}>
        <InputNumber
          defaultValue={props.defaultValue}
          min={props.min}
          max={props.max}
          style={{ margin: "0 16px" }}
          step={props.step}
          value={inputValue}
          onChange={onChange}
        />
      </Col>
    </Row>
  );
}
