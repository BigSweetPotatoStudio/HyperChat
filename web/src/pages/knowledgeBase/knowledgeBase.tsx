import React, { useEffect, useState } from "react";
// import { pipeline, env } from "@xenova/transformers";
//     //   let localModelPath = await call("pathJoin", ["cache"]);
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
import { call } from "../../common/call";
import {
  Button,
  Divider,
  Input,
  message,
  Modal,
  Popconfirm,
  Popover,
  Space,
  Table,
  Tooltip,
} from "antd";
import { MyProgress } from "../../common/progress";
import {
  electronData,
  KNOWLEDGE_BASE,
  KNOWLEDGE_Store,
} from "../../../../common/data";
import { KnowledgeBaseModal } from "./knowledgeBaseModal";
import { v4 } from "uuid";
import { KnowledgeBaseResourceModal } from "./knowledgeBaseResourceModal";
import { Divide } from "lucide-react";
import { t } from "../../i18n";

const { Search } = Input;

export function KnowledgeBase() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  useEffect(() => {
    (async () => {
      await KNOWLEDGE_BASE.init();
      refresh();
    })();
  }, []);
  const [isOpenProgress, setIsOpenProgress] = useState(false);
  const [currRowKnowledgeBase, setCurrRowKnowledgeBase] = useState(
    {} as any as KNOWLEDGE_Store,
  );

  const columns = [
    {
      title: t`name`,
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Popover title={"model: " + record.model} content={record.description}>
          <span className="cursor-pointer">{text}</span>
        </Popover>
      ),
    },
    {
      title: t`operation`,
      dataIndex: "operation",
      key: "operation",
      render: (text, record) => (
        <div>
          <a
            onClick={() => {
              setCurrRowKnowledgeBase(record);
              setIsOpenKnowledgeBase(true);
            }}
          >
            {t`Edit`}
          </a>
          <Divider type="vertical"></Divider>
          <a
            onClick={() => {
              setCurrRowKnowledgeBase(record);
            }}
          >
            {t`Open`}
          </a>
          <Divider type="vertical"></Divider>
          <Popconfirm
            title={t`Sure to delete?`}
            onConfirm={async () => {
              await call("vectorStoreDelete", [record]);
              KNOWLEDGE_BASE.get().dbList = KNOWLEDGE_BASE.get().dbList.filter(
                (x) => x.key !== record.key,
              );
              await KNOWLEDGE_BASE.save();
              call("openMcpClient", ["hyper_knowledge_base"]);
              refresh();
            }}
          >
            <a>{t`Delete`}</a>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const [isOpenKnowledgeBase, setIsOpenKnowledgeBase] = useState(false);
  const [isOpenResource, setIsOpenResource] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  return (
    <div>
      <div className="flex">
        <div className="w-1/3">
          <Space>
            <Button
              onClick={() => {
                setCurrRowKnowledgeBase({} as any as KNOWLEDGE_Store);
                setIsOpenKnowledgeBase(true);
              }}
              type="primary"
            >
              {t`Create`}
            </Button>
          </Space>
          <Table
            rowKey="key"
            dataSource={KNOWLEDGE_BASE.get().dbList}
            columns={columns}
          />
        </div>
        {currRowKnowledgeBase.key && (
          <div className="w-2/3">
            <div className="flex justify-between">
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    setIsOpenResource(true);
                  }}
                >
                  {t`Add`}
                </Button>
                <Search
                  onSearch={async (e) => {
                    // console.log("searchValue", e);
                    setLoadingSearch(true);
                    let res = await call("vectorStoreSearch", [
                      currRowKnowledgeBase,
                      e,
                      5,
                    ]);
                    Modal.info({
                      title: "Search Result",
                      width: 1200,
                      maskClosable: true,
                      content: (
                        <Table
                          pagination={false}
                          rowKey="key"
                          dataSource={res}
                          columns={[
                            {
                              title: "pageContent",
                              dataIndex: "pageContent",
                              key: "pageContent",
                            },
                            {
                              title: "score",
                              dataIndex: "score",
                              key: "score",
                            },
                          ]}
                        />
                      ),
                    });

                    setLoadingSearch(false);
                  }}
                  placeholder={t`test search top 5`}
                  enterButton={t`Search`}
                  loading={loadingSearch}
                />
              </Space>
              <Space>
                {!electronData.get().downloaded[currRowKnowledgeBase.model] && (
                  <Button
                    onClick={() => {
                      call("initEmbeddings", [currRowKnowledgeBase.model]);
                    }}
                  >
                    {t`Download Model`}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setIsOpenProgress(true);
                  }}
                >
                  {t`Check Progress`}
                </Button>
              </Space>
            </div>

            <Table
              rowKey="key"
              dataSource={currRowKnowledgeBase.resources}
              columns={[
                {
                  title: t`Name`,
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: t`FilePath`,
                  dataIndex: "filepath",
                  key: "filepath",
                  render: (text, record) => (
                    <>
                      <a
                        onClick={async () => {
                          // let f = await call("pathJoin", [record.filepath]);
                          let e = await call("exists", [record.filepath, ""]);
                          if (e) {
                            await call("openExplorer", [record.filepath]);
                          } else {
                            message.error("file not exists");
                          }
                        }}
                      >
                        {t`Open`}
                      </a>
                      <Divider type="vertical" />
                      <Popconfirm
                        title={t`Sure to delete?`}
                        onConfirm={async () => {
                          let f = await call("vectorStoreRemoveResource", [
                            currRowKnowledgeBase,
                            record,
                          ]);
                          currRowKnowledgeBase.resources =
                            currRowKnowledgeBase.resources.filter((x) => {
                              return x.key !== record.key;
                            });
                          KNOWLEDGE_BASE.save();
                          message.success("remove success");

                          refresh();
                        }}
                      >
                        <a>{t`Remove`}</a>
                      </Popconfirm>
                    </>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>
      <Modal
        title={t`Progress`}
        destroyOnClose={true}
        open={isOpenProgress}
        onOk={() => setIsOpenProgress(false)}
        onCancel={() => setIsOpenProgress(false)}
      >
        <MyProgress></MyProgress>
      </Modal>
      <KnowledgeBaseModal
        open={isOpenKnowledgeBase}
        initialValues={currRowKnowledgeBase}
        onCreate={async (v) => {
          if (
            KNOWLEDGE_BASE.get().dbList.find(
              (x) => x.name === v.name && x.key !== v.key,
            )
          ) {
            message.warning("name already exists");
            return;
          }

          if (currRowKnowledgeBase.key) {
            let i = KNOWLEDGE_BASE.get().dbList.findIndex(
              (x) => x.key === currRowKnowledgeBase.key,
            );
            Object.assign(KNOWLEDGE_BASE.get().dbList[i], v);
          } else {
            v.key = v4();
            v.resources = [];
            KNOWLEDGE_BASE.get().dbList.push(v);
          }
          await KNOWLEDGE_BASE.save();
          call("openMcpClient", ["hyper_knowledge_base"]);
          setIsOpenKnowledgeBase(false);
        }}
        onCancel={() => {
          setIsOpenKnowledgeBase(false);
        }}
      />

      <KnowledgeBaseResourceModal
        open={isOpenResource}
        initialValues={{} as any}
        onCreate={async (v) => {
          console.log(v);
          if (!electronData.get().downloaded[currRowKnowledgeBase.model]) {
            setIsOpenProgress(true);
          }
          v.key = v4();
          await call("initEmbeddings", [currRowKnowledgeBase.model]);
          let r = await call("vectorStoreAdd", [currRowKnowledgeBase, v]);
          if (!Array.isArray(currRowKnowledgeBase.resources)) {
            currRowKnowledgeBase.resources = [];
          }
          currRowKnowledgeBase.resources.push(r);
          await KNOWLEDGE_BASE.save();
          setIsOpenResource(false);
          refresh();
        }}
        onCancel={() => {
          setIsOpenResource(false);
        }}
      />
    </div>
  );
}
