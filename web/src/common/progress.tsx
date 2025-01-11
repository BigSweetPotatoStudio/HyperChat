import React, { useEffect, useState } from "react";
import { call } from "./call";
import { Button, Progress } from "antd";

// // Create a feature-extraction pipeline
// const extractor = await pipeline("feature-extraction", "Xenova/bge-m3");

// // Compute sentence embeddings
// const texts = ["What is BGE M3?", "Defination of BM25"];
// const embeddings = await extractor(texts, { pooling: "cls", normalize: true });
// console.log(embeddings);
// // Tensor {
// //   dims: [ 2, 1024 ],
// //   type: 'float32',
// //   data: Float32Array(2048) [ -0.0340719036757946, -0.04478546231985092, ... ],
// //   size: 2048
// // }

// console.log(embeddings.tolist()); // Convert embeddings to a JavaScript list
// // [
// //   [ -0.0340719036757946, -0.04478546231985092, -0.004497686866670847, ... ],
// //   [ -0.015383965335786343, -0.041989751160144806, -0.025820579379796982, ... ]
// // ]
export function MyProgress({ time = 1000 }) {
  let [data, setData] = useState([]);
  async function checkProgress() {
    let data = await call("getProgressList", []);
    setData(data);
    console.log(data);
  }
  useEffect(() => {
    checkProgress();
    let t = setInterval(checkProgress, time);
    return () => {
      clearInterval(t);
    };
  }, []);
  return (
    <div>
      {data.map((x, i) => {
        return (
          <div>
            <div className="text-lg font-bold">{x.name}</div>
            <Progress key={i} percent={x.progress} size="small" />
          </div>
        );
      })}
      {data.length == 0 && <div>No progress</div>}
    </div>
  );
}
