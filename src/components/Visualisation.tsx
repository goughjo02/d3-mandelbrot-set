"use client";

import { scaleLinear, select } from "d3";
import { useEffect, useMemo, useRef } from "react";

type VisualisationProps = {};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const yExtent = [-1.2, -1];
const xExtent = [-0.9, 0.2];

const mandelbrot = (c: { r: number; i: number }) => {
  let z = { x: 0, y: 0 };
  let n = 0;
  while (n < 100) {
    const x = z.x * z.x - z.y * z.y + c.r;
    const y = 2 * z.x * z.y + c.i;
    z = { x, y };
    if (z.x * z.x + z.y * z.y > 4) {
      break;
    }
    n++;
  }
  return n;
};

const draw = ({
  el,
  height,
  width,
}: {
  el: SVGSVGElement;
  height: number;
  width: number;
}) => {
  const svg = select(el);
  const pixelHeight = 1;
  const pixelWidth = 1;
  const numberX = Number(width) / pixelWidth;
  const numberY = Number(height) / pixelHeight;
  const rScale = scaleLinear().domain([0, width]).range(xExtent);
  const iScale = scaleLinear().domain([0, height]).range(yExtent);
  const colorScale = scaleLinear().domain([0, 100]).range([0, 360]);

  const dataForDisplay = Array.from({ length: numberX }, (_, xi) =>
    Array.from({ length: numberY }, (_, xj) => {
      const x = xi * pixelWidth;
      const y = xj * pixelHeight;
      const r = rScale(x);
      const i = iScale(y);
      return {
        x,
        y,
        n: mandelbrot({ r, i }),
      };
    })
  );

  svg.selectAll("rect").remove();
  svg
    .selectAll("rect")
    .data(dataForDisplay.flat())
    .enter()
    .append("rect")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("width", pixelWidth)
    .attr("height", pixelHeight)
    .attr("fill", (d) => {
      if (d.n === 100) {
        return "black";
      }
      const hue = colorScale(d.n);
      return `hsl(${hue}, 100%, 50%)`;
    });
};

export const Visualisation = (_props: VisualisationProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const width = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return window.innerWidth;
  }, []);
  const height = useMemo(() => {
    if (typeof window === "undefined") return 0;
    return window.innerHeight;
  }, []);
  useEffect(() => {
    if (!ref.current) return;
    draw({ height, el: ref.current, width });
  }, [ref, width, height]);
  return (
    <svg
      className="border-red-100 border-4"
      height={height}
      width={width}
      ref={ref}
    />
  );
};

export default Visualisation;
