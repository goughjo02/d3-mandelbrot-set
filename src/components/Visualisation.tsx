"use client";

import { range, scaleLinear, select } from "d3";
import { useEffect, useId, useRef, useState } from "react";

type VisualisationProps = {};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const xResolution = 0.01;
const yResolution = 0.01;

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
  const tooltipId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<null | SVGSVGElement>(null);

  const [yExtent, setYExtent] = useState([-1.2, 1.2]);
  const [xExtent, setXExtent] = useState([-2.1, 0.7]);
  // const [yExtent, setYExtent] = useState([-1.2, 0]);
  // const [xExtent, setXExtent] = useState([-1.9, 0.2]);

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
    // remove tooltip if exists
    const tooltip = document.getElementById(tooltipId);
    if (tooltip) {
      tooltip.remove();
    }
    const newTooltip = document.createElement("math");
    newTooltip.setAttribute("id", tooltipId);
    newTooltip.style.position = "absolute";
    newTooltip.style.display = "none";
    newTooltip.style.backgroundColor = "black";
    newTooltip.style.color = "white";
    newTooltip.style.padding = "5px";
    newTooltip.style.borderRadius = "5px";
    newTooltip.style.fontSize = "12px";
    newTooltip.style.fontFamily = "sans-serif";
    newTooltip.style.zIndex = "100";
    ref.current.appendChild(newTooltip);
  }, [ref, height, width, tooltipId]);

  useEffect(() => {
    if (!svg) return;
    const yPoints = range(yExtent[0], yExtent[1], yResolution);
    const xPoints = range(xExtent[0], xExtent[1], xResolution);

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
            r,
            i,
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
      })
      .on("mouseover", (e, d) => {
        const tooltip = document.getElementById(tooltipId);
        if (!tooltip) return;
        tooltip.style.display = "block";
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY + 10}px`;
        const real = Math.round(d.r * 10) / 10;
        const imaginary = Math.round(d.i * 10) / 10;
        tooltip.innerHTML = `${real}${imaginary < 0 ? "" : " + "}${imaginary}i`;
      });
  }, [svg, height, width, yExtent, xExtent, tooltipId]);

  return <div ref={ref}></div>;
};

export default Visualisation;
