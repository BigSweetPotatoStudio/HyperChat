import React, { useRef } from "react";
import { MyMessage } from "@dadigua/hyperchat-shared/types";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { CustomMessageList, CustomMessageListRef } from "./CustomMessageList";

export const Messages = ({ messages, onSumbit, readOnly, status, onClone }: {
    messages: MyMessage[];
    onSumbit: (messages: MyMessage[]) => void; 
    readOnly?: boolean,
    // setContainer?: (container: any) => void;
    status?: string;
    onClone?: (index: number) => void;
}) => {
    const refresh = useForceUpdate();
    const contexts = useRef<{ [key: string]: { edit: boolean } }>({});
    // const containerRef = useRef<CustomMessageListRef>(null);

    return (
        <CustomMessageList
            ref={(e) => {
                // containerRef.current = e;
                // setContainer && setContainer(e);
            }}
            messages={messages}
            onSumbit={onSumbit}
            readOnly={readOnly}
            status={status}
            onClone={onClone}
            contexts={contexts.current}
            onContextUpdate={refresh}
            className="bubble-list"
            style={{
                paddingRight: 4,
                height: messages?.length > 0 ? "100%" : 0,
            }}
        />
    );
};