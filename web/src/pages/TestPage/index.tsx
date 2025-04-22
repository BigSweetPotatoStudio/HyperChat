import React from "react";
import { Editor } from "../../components/editor";

export const TestPage = () => {
    return <div className="h-full">
        <Editor style={{ height: 400 }} value="你是一个超级AI，回答问题用中文。\nIf you want to change something in the library, go to monaco-react/src/..., the library will be automatically re-built and the playground will use the latest build" onChange={(value) => console.log(value)}></Editor>
    </div>
};

