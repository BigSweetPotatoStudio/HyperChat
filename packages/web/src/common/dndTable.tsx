import React, { createContext, useContext, useMemo } from "react";
import { HolderOutlined } from "@ant-design/icons";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Table } from "antd";
import type { TableProps } from "antd";

/**
 * Defines the context properties for a draggable row.
 */
interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = createContext<RowContextProps>({});

/**
 * A component that renders the drag handle for a table row.
 */
const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: "move" }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

/**
 * Defines the props for a draggable table row.
 */
interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  "data-row-key": string;
}

/**
 * A component that renders a sortable table row.
 */
const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 9999 } : {}),
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners]
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

/**
 * Defines the props for the DndTable component.
 */
interface DndTableProps<T extends object> extends TableProps<T> {
  /**
   * The data source for the table.
   */
  dataSource: T[];
  /**
   * A callback function that is triggered after a drag-and-drop operation.
   * @param {T[]} newDataSource - The data source after reordering.
   */
  onMove?: (newDataSource: T[]) => void;
}

/**
 * A generic, drag-and-drop enabled Ant Design Table component.
 * @template T - The type of the record in the table.
 * @param {DndTableProps<T>} props - The props for the component.
 */
export const DndTable = <T extends { key: React.Key }>(props: DndTableProps<T>) => {
  const { dataSource, onMove, ...restProps } = props;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (active.id !== over?.id) {
      const activeIndex = dataSource.findIndex((record) => record.key === active.id);
      const overIndex = dataSource.findIndex((record) => record.key === over?.id);
      const newDataSource = arrayMove(dataSource, activeIndex, overIndex);
      
      // Trigger the onMove callback with the updated data source.
      onMove?.(newDataSource);
    }
  };

  return (
    <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext
        items={dataSource.map((i) => i.key)}
        strategy={verticalListSortingStrategy}
      >
        <Table<T>
          {...restProps}
          rowKey="key"
          components={{ body: { row: Row } }}
          columns={[
            {
              key: "sort",
              align: "center",
              width: 50,
              render: () => <DragHandle />,
            },
            ...(props.columns || []),
          ]}
          dataSource={dataSource}
        />
      </SortableContext>
    </DndContext>
  );
};
