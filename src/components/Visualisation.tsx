"use client";

import { select } from "d3";
import { memo, useEffect, useId, useRef, useState } from "react";
import { DataPoint } from "./types";

type VisualisationProps = {
  dataForDisplay: DataPoint[];
  height: number;
  width: number;
  pixelHeight: number;
  pixelWidth: number;
  showTooltip: boolean;
  zoomOnPoint: (r: number, i: number) => void;
};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const Visualisation = ({
  dataForDisplay,
  height,
  width,
  pixelHeight,
  pixelWidth,
  showTooltip,
  zoomOnPoint,
}: VisualisationProps) => {
  const tooltipId = useId();
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const data = select(ref.current).selectAll("rect").data(dataForDisplay);
    data
      .join("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", pixelWidth)
      .attr("height", pixelHeight)
      .attr("id", (d) => `${d.x}-${d.y}`)
      .attr("fill", (d) => {
        if (d.n === 100) {
          return "black";
        }
        return d.color;
      })
      .on("mouseover", (e, d) => {
        if (!showTooltip) return;
        const tooltip = document.getElementById(tooltipId);
        if (!tooltip) return;
        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        const real = Math.round(d.r * 10) / 10;
        const imaginary = Math.round(d.i * 10) / 10;
        tooltip.innerHTML = `${real}${imaginary < 0 ? "" : " + "}${imaginary}i`;
      })
      .on("mouseout", (e, d) => {
        const tooltip = document.getElementById(tooltipId);
        if (!tooltip) return;
        tooltip.style.display = "none";
      })
      // add double click zoom in
      .on("dblclick", (e, d) => {
        zoomOnPoint(d.r, d.i);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataForDisplay]);

  return (
    <svg ref={ref} width={width} height={height}>
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
    </svg>
  );
};

export default memo(Visualisation);
