import React, { useEffect, useState } from "react";
// import { pipeline, env } from "@xenova/transformers";
import { call } from "../../common/call";
import { Button, Modal, Space } from "antd";
import { MyProgress } from "../../common/progress";

export function KnowledgeBase() {
  useEffect(() => {
    (async () => {
      //   let localModelPath = await call("pathJoin", ["cache"]);
      //   env.localModelPath = localModelPath;
      //   env.allowRemoteModels = false;
      //   // Create a feature-extraction pipeline
      //   const extractor = await pipeline("feature-extraction", "Xenova/bge-m3");
      //   // Compute sentence embeddings
      //   const texts = ["What is BGE M3?", "Defination of BM25"];
      //   const embeddings = await extractor(texts, {
      //     pooling: "cls",
      //     normalize: true,
      //   });
      //   console.log(embeddings);
      //   // Tensor {
      //   //   dims: [ 2, 1024 ],
      //   //   type: 'float32',
      //   //   data: Float32Array(2048) [ -0.0340719036757946, -0.04478546231985092, ... ],
      //   //   size: 2048
      //   // }
      //   console.log(embeddings.tolist()); // Convert embeddings to a JavaScript list
      //   // [
      //   //   [ -0.0340719036757946, -0.04478546231985092, -0.004497686866670847, ... ],
      //   //   [ -0.015383965335786343, -0.041989751160144806, -0.025820579379796982, ... ]
      //   // ]
    })();
  }, []);
  const [isOpenProgress, setIsOpenProgress] = useState(false);
  return (
    <div>
      <Space>
        <Button
          onClick={() => {
            call("initEmbeddings", []);
          }}
        >
          Download bge-m3
        </Button>
        <Button
          onClick={() => {
            setIsOpenProgress(true);
          }}
        >
          Check Progress
        </Button>
      </Space>

      <Modal
        title="Progress"
        destroyOnClose={true}
        open={isOpenProgress}
        onOk={() => setIsOpenProgress(false)}
        onCancel={() => setIsOpenProgress(false)}
      >
        <MyProgress></MyProgress>
      </Modal>
    </div>
  );
}
