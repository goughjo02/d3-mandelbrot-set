"use client";

import { ScaleLinear, select } from "d3";
import { memo, useCallback, useEffect, useId, useRef } from "react";
import { DataPoint } from "./types";

type VisualisationCanvasProps = {
  dataForDisplay: DataPoint[];
  height: number;
  width: number;
  pixelHeight: number;
  pixelWidth: number;
  showTooltip: boolean;
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
  showTooltip,
  zoomOnPoint,
}: VisualisationCanvasProps) => {
  const tooltipId = useId();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // const data = select(ref.current).selectAll("rect").data(dataForDisplay);
    // data
    //   .join("rect")
    //   .attr("x", (d) => d.x)
    //   .attr("y", (d) => d.y)
    //   .attr("width", pixelWidth)
    //   .attr("height", pixelHeight)
    //   .attr("id", (d) => `${d.x}-${d.y}`)
    //   .attr("fill", (d) => {
    //     if (d.n === 100) {
    //       return "black";
    //     }
    //     return d.color;
    //   })
    //   .on("mouseover", (e, d) => {
    //     if (!showTooltip) return;
    //     const tooltip = document.getElementById(tooltipId);
    //     if (!tooltip) return;
    //     tooltip.style.display = "block";
    //     tooltip.style.left = `${e.clientX + 10}px`;
    //     tooltip.style.top = `${e.clientY + 10}px`;
    //     const real = Math.round(d.r * 10) / 10;
    //     const imaginary = Math.round(d.i * 10) / 10;
    //     tooltip.innerHTML = `${real}${imaginary < 0 ? "" : " + "}${imaginary}i`;
    //   })
    //   .on("mouseout", (e, d) => {
    //     const tooltip = document.getElementById(tooltipId);
    //     if (!tooltip) return;
    //     tooltip.style.display = "none";
    //   })
    //   // add double click zoom in
    //   .on("dblclick", (e, d) => {
    //     zoomOnPoint(d.r, d.i);
    //   });
    const ctx = ref.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    dataForDisplay.forEach((d) => {
      ctx.fillStyle = d.n === 100 ? "black" : d.color;
      ctx.fillRect(d.x, d.y, pixelWidth, pixelHeight);
    });

    // gradually pans left from the fifth to the seventh round feature (-1.4002, 0) to (-1.4011, 0) while the view magnifies by a factor of 21.78
    // const timer = setTimeout(() => {
    //   zoomOnPoint(-1.404, -0.0005);
    // }, 1000);
    // return () => clearTimeout(timer);

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
