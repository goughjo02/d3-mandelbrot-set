"use client";

import { range, scaleLinear, select } from "d3";
import { useEffect, useMemo, useRef } from "react";

type VisualisationProps = {};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const yExtent = [-1.2, 0];
const xExtent = [-0.9, 0.2];

const xResolution = 0.01;
const yResolution = 0.01;

const yPoints = range(yExtent[0], yExtent[1], yResolution);
const xPoints = range(xExtent[0], xExtent[1], xResolution);

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
  el: HTMLCanvasElement;
  height: number;
  width: number;
}) => {
  const colorScale = scaleLinear().domain([0, 100]).range([0, 360]);

  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, height]);

  const pixelHeight = height / yPoints.length;
  const pixelWidth = width / xPoints.length;

  const dataForDisplay = xPoints.map((r, xi) =>
    yPoints.map((i, xj) => {
      const x = xi * pixelWidth;
      const y = xj * pixelHeight;
      return {
        x: xScale(r),
        y: yScale(i),
        n: mandelbrot({ r, i }),
      };
    })
  );

  const ctx = el.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  dataForDisplay.forEach((row) => {
    row.forEach((d) => {
      if (d.n === 100) {
        return;
      }
      const hue = colorScale(d.n);
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(d.x, d.y, pixelWidth, pixelHeight);
    });
  });
};

export const Visualisation = (_props: VisualisationProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const width = window.innerWidth;
  const height = window.innerHeight;
  useEffect(() => {
    if (!ref.current) return;
    draw({ height, el: ref.current, width });
  }, [ref, width, height]);
  return (
    <canvas
      className="border-red-100 border-4"
      height={height}
      width={width}
      ref={ref}
    />
  );
};

export default Visualisation;
