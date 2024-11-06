"use client";

import { ScaleLinear } from "d3";
import { memo, useCallback, useEffect, useId, useRef } from "react";
import { DataPoint } from "./types";

type VisualisationCanvasProps = {
  dataForDisplay: DataPoint[];
  height: number;
  width: number;
  pixelHeight: number;
  pixelWidth: number;
  zoomOnPoint: (r: number, i: number) => void;
  scales: {
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
  } | null;
};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const VisualisationCanvas = ({
  dataForDisplay,
  height,
  width,
  pixelHeight,
  pixelWidth,
  scales,
  zoomOnPoint,
}: VisualisationCanvasProps) => {
  const tooltipId = useId();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    dataForDisplay.forEach((d) => {
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, pixelWidth, pixelHeight);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataForDisplay]);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const r = scales?.xScale.invert(x);
      const i = scales?.yScale.invert(y);
      if (r === undefined || i === undefined) return;
      zoomOnPoint(r, i);
    },
    [scales, zoomOnPoint]
  );

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      onDoubleClick={onDoubleClick}
    >
      <div
        id={tooltipId}
        style={{
          position: "absolute",
          display: "none",
          backgroundColor: "black",
          color: "white",
          padding: "5px",
          borderRadius: "5px",
          fontSize: "12px",
          fontFamily: "sans-serif",
          zIndex: 100,
        }}
      ></div>
    </canvas>
  );
};

export default memo(VisualisationCanvas);
