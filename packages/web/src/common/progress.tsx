import React, { useEffect, useState } from "react";
import { call } from "./call";
import { Progress } from "antd";

/**
 * Defines the structure of a single progress item.
 */
interface ProgressItem {
  name: string;
  progress: number;
}

/**
 * Defines the props for the MyProgress component.
 */
interface MyProgressProps {
  /**
   * The interval in milliseconds at which to check for progress updates.
   * @default 1000 (1 second)
   */
  time?: number;
}

/**
 * A React component that displays a list of progress items fetched from a backend API.
 * It periodically polls the backend for updates and renders them as Ant Design Progress bars.
 * @param {MyProgressProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered progress component.
 */
export function MyProgress({ time = 1000 }: MyProgressProps): React.ReactElement {
  const [data, setData] = useState<ProgressItem[]>([]);

  /**
   * Fetches the latest progress list from the backend.
   */
  async function checkProgress() {
    try {
      // const fetchedData: ProgressItem[] = await call("getProgressList", undefined);
      const fetchedData: ProgressItem[] = [];
      setData(fetchedData);
      console.log("Progress data fetched:", fetchedData);
    } catch (error) {
      console.error("Failed to fetch progress list:", error);
    }
  }

  useEffect(() => {
    checkProgress(); // Initial fetch
    const intervalId = setInterval(checkProgress, time);

    // Cleanup function to clear the interval when the component unmounts.
    return () => {
      clearInterval(intervalId);
    };
  }, [time]); // Re-run effect if `time` prop changes.

  return (
    <div>
      {data.map((x, i) => (
        <div key={i}>
          <div className="text-lg font-bold">{x.name}</div>
          <Progress percent={x.progress} size="small" />
        </div>
      ))}
      {data.length === 0 && <div>No progress</div>}
    </div>
  );
}

