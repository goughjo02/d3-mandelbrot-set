"use client";

import { range, scaleLinear, select } from "d3";
import { useEffect, useId, useRef, useState } from "react";

type VisualisationProps = {};

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

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

const initialXExtent = [-2.1, 0.7];
const initialYExtent = [-1.2, 1.2];
// const initialXExtent = [-1.9, 0.2];
// const initialYExtent = [-1.2, 0];

// const xResolution = 0.01;
// const yResolution = 0.01;

const resolutions = {
  low: 100,
  medium: 200,
  high: 500,
  "very high": 700,
  "too high": 1000,
  "way too high": 1500,
} as const;

const seenInfoMessageKey = "seenInfoMessage";

interface DataPoint {
  x: number;
  y: number;
  n: number;
  r: number;
  i: number;
}

export const Visualisation = (_props: VisualisationProps) => {
  const tooltipId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<null | SVGSVGElement>(null);
  const [resolution, setResolution] = useState<keyof typeof resolutions>("low");

  const [yExtent, setYExtent] = useState(initialYExtent);
  const [xExtent, setXExtent] = useState(initialXExtent);

  const [dataForDisplay, setDataForDisplay] = useState<DataPoint[]>([]);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const width = window.innerWidth;
  const height = window.innerHeight;

  const desiredXPixels = Math.min(resolutions[resolution], width);
  const desiredYPixels = Math.min(resolutions[resolution], height);
  const xResolution = (xExtent[1] - xExtent[0]) / desiredXPixels;
  const yResolution = (yExtent[1] - yExtent[0]) / desiredYPixels;

  const seenInfoMessage = localStorage.getItem(seenInfoMessageKey);
  const [showInfoMessage, setShowInfoMessage] = useState(!seenInfoMessage);
  const [dontShowInfoMessageAgain, setDontShowInfoMessageAgain] =
    useState(false);

  useEffect(() => {
    if (!ref.current) return;
    // delete the svg if it exists
    const existingSvg = ref.current.querySelector("svg");
    if (existingSvg) {
      existingSvg.remove();
    }
    // append svg
    const newSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    newSvg.setAttribute("width", width.toString());
    newSvg.setAttribute("height", height.toString());
    ref.current.appendChild(newSvg);
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
    setSvg(newSvg);
  }, [ref, height, width, tooltipId]);

  useEffect(() => {
    if (!svg) return;
    const yPoints = range(yExtent[0], yExtent[1], yResolution);
    const xPoints = range(xExtent[0], xExtent[1], xResolution);

    const xScale = scaleLinear().domain(xExtent).range([0, width]);
    const yScale = scaleLinear().domain(yExtent).range([0, height]);
    const newDataForDisplay = xPoints
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
    setDataForDisplay(newDataForDisplay);
    setDimensions({
      width: xPoints.length,
      height: yPoints.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg, yExtent, xExtent, yResolution, xResolution]);

  useEffect(() => {
    const data = select(svg).selectAll("rect").data(dataForDisplay);
    data
      .join("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", width / dimensions?.width)
      .attr("height", height / dimensions?.height)
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
      })
      .on("mouseout", (e, d) => {
        const tooltip = document.getElementById(tooltipId);
        if (!tooltip) return;
        tooltip.style.display = "none";
      })
      // add double click zoom in
      .on("dblclick", (e, d) => {
        const xRange = xExtent[1] - xExtent[0];
        const yRange = yExtent[1] - yExtent[0];
        const newXExtent: [number, number] = [
          d.r - xRange / 4,
          d.r + xRange / 4,
        ];
        const newYExtent: [number, number] = [
          d.i - yRange / 4,
          d.i + yRange / 4,
        ];
        setNewExtent(newXExtent, newYExtent);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataForDisplay]);

  const reset = () => {
    setYExtent(initialYExtent);
    setXExtent(initialXExtent);
  };

  const setNewExtent = (
    newXExtent: [number, number],
    newYExtent: [number, number]
  ) => {
    setYExtent(newYExtent);
    setXExtent(newXExtent);
  };

  return (
    <div ref={ref}>
      <div className="absolute top-0 left-0 flex flex-col">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
          onClick={reset}
        >
          Reset
        </button>
        {/* select resolution */}
        <label className="mx-2 my-1">Resolution</label>
        <select
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
          onChange={(e) =>
            setResolution(e.target.value as keyof typeof resolutions)
          }
        >
          {Object.keys(resolutions).map((resolution) => (
            <option key={resolution} value={resolution}>
              {resolution}
            </option>
          ))}
        </select>
      </div>
      {showInfoMessage && (
        <div className="absolute top-0 right-0 h-full w-full flex justify-center items-center">
          <div className="bg-white p-4 rounded text-black">
            <h1 className="text-2xl font-bold">Mandelbrot Set</h1>
            <p>
              This is a visualisation of the Mandelbrot set. The Mandelbrot set
              is the set of complex numbers c for which the function f_c(z) =
              z^2 + c does not diverge when iterated from z = 0, i.e., for which
              the sequence f_c(0), f_c(f_c(0)), etc., remains bounded in
              absolute value.
            </p>
            <p>
              The colour of each pixel is determined by the number of iterations
              it takes for the function to diverge. The more iterations it
              takes, the darker the pixel.
            </p>
            <h2 className="text-xl font-bold">Controls</h2>
            <p>
              You can zoom in by double clicking on a pixel. You can also change
              the resolution of the visualisation but{" "}
              <strong>
                be careful as setting the resolution too high will likely crash
                the site in your browser
              </strong>
              . I recommend you zoom in to an area of interest while on low
              resolution, and then go to high resolution.
            </p>
            <p>Also as far as I can tell, the site will not work on mobile.</p>
            <div className="flex flex-row my-2 items-center justify-center">
              {!seenInfoMessage && (
                <>
                  <label className="mx-2">
                    Do not show this message on open
                  </label>
                  <input
                    type="checkbox"
                    className="mx-2 my-1"
                    onChange={(e) =>
                      setDontShowInfoMessageAgain(e.target.checked)
                    }
                  />{" "}
                </>
              )}
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
                onClick={() => {
                  setShowInfoMessage(false);
                  if (dontShowInfoMessageAgain) {
                    localStorage.setItem(seenInfoMessageKey, "true");
                  }
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {!showInfoMessage && (
        <div className="absolute top-0 right-0">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
            onClick={() => setShowInfoMessage(true)}
          >
            Info
          </button>
        </div>
      )}
    </div>
  );
};

export default Visualisation;
