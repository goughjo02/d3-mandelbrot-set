"use client";

import { range, scaleLinear, select } from "d3";
import { useEffect, useRef, useState } from "react";

type VisualisationProps = {};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const yExtent = [-1.2, 0];
const xExtent = [-1.9, 0.2];

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

const colorScale = scaleLinear().domain([0, 100]).range([0, 360]);

export const Visualisation = (_props: VisualisationProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<null | SVGSVGElement>(null);
  const width = window.innerWidth;
  const height = window.innerHeight;
  useEffect(() => {
    if (!ref.current) return;
    // delete the children
    while (ref.current.firstChild) {
      ref.current.removeChild(ref.current.firstChild);
    }
    // append svg
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("width", width.toString());
    newSvg.setAttribute("height", height.toString());
    ref.current.appendChild(newSvg);
    setSvg(newSvg);
  }, [ref, height, width]);

  useEffect(() => {
    if (!svg) return;
    const xScale = scaleLinear().domain(xExtent).range([0, width]);
    const yScale = scaleLinear().domain(yExtent).range([0, height]);
    const dataForDisplay = xPoints
      .map((r, xi) =>
        yPoints.map((i, xj) => {
          const x = xi;
          const y = xj;
          return {
            x: xScale(r),
            y: yScale(i),
            n: mandelbrot({ r, i }),
          };
        })
      )
      .flat();
    const data = select(svg).selectAll("rect").data(dataForDisplay);
    data
      .join("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", width / xPoints.length)
      .attr("height", height / yPoints.length)
      .attr("id", (d) => `${d.x}-${d.y}`)
      .attr("fill", (d) => {
        if (d.n === 100) {
          return "black";
        }
        const hue = colorScale(d.n);
        return `hsl(${hue}, 100%, 50%)`;
      });
  }, [svg, height, width]);

  return <div ref={ref}></div>;
};

export default Visualisation;
