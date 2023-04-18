"use client";

import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import { ScaleLinear, extent } from "d3";
import {
  ChangeEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import VisualisationSvg from "./VisualisationSvg";
import VisualisationCanvas from "./VisualisationCanvas";

const createWorker = createWorkerFactory(() => import("./mandelbrot.worker"));

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

const initialXExtent: [number, number] = [-2.1, 0.7];
const initialYExtent: [number, number] = [-1.2, 1.2];
// const initialXExtent = [-1.9, 0.2];
// const initialYExtent = [-1.2, 0];

// const xResolution = 0.01;
// const yResolution = 0.01;

const resolutions = {
  "100": 100,
  "200": 200,
  "500": 500,
  "700": 700,
  "1000": 1000,
  "1500": 1500,
  "2000": 2000,
} as const;

const seenInfoMessageKey = "seenInfoMessage";

interface DataPoint {
  x: number;
  y: number;
  n: number;
  r: number;
  i: number;
  color: string;
}

type renderElement = "svg" | "canvas";

function getResolution({
  xExtent,
  yExtent,
  width,
  height,
  resolution,
}: {
  xExtent: [number, number];
  yExtent: [number, number];
  width: number;
  height: number;
  resolution: keyof typeof resolutions;
}) {
  const desiredXPixels = Math.min(resolutions[resolution], width);
  const desiredYPixels = Math.min(resolutions[resolution], height);
  const xResolution = (xExtent[1] - xExtent[0]) / desiredXPixels;
  const yResolution = (yExtent[1] - yExtent[0]) / desiredYPixels;
  return { xResolution, yResolution };
}

const initialBreakoutNumber = 4;

export const MandelbrotSet = () => {
  const [renderElement, setRenderElement] = useState<renderElement>("canvas");
  const initialResolution = renderElement === "svg" ? "100" : "1500";
  const [resolution, setResolution] =
    useState<keyof typeof resolutions>(initialResolution);
  const [xExtent, setXExtent] = useState<[number, number]>(initialXExtent);
  const [yExtent, setYExtent] = useState<[number, number]>(initialYExtent);
  const [breakoutNumber, setBreakoutNumber] = useState(initialBreakoutNumber);

  const worker = useWorker(createWorker);

  const [dataForDisplay, setDataForDisplay] = useState<DataPoint[]>([]);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  const width = window.innerWidth;
  const height = window.innerHeight;

  const seenInfoMessage = localStorage.getItem(seenInfoMessageKey);
  const [showInfoMessage, setShowInfoMessage] = useState(!seenInfoMessage);
  const [dontShowInfoMessageAgain, setDontShowInfoMessageAgain] =
    useState(false);

  const [isMounted, setIsMounted] = useState(true);

  const [isLoadingDataForDisplay, setIsLoadingDataForDisplay] = useState(false);

  const [scales, setScales] = useState<{
    xScale: ScaleLinear<number, number, never>;
    yScale: ScaleLinear<number, number, never>;
  } | null>(null);

  useEffect(() => {
    setNewParameters({
      newBreakoutNumber: breakoutNumber,
      newXExtent: initialXExtent,
      newYExtent: initialYExtent,
      maxIterations: 100,
      resolution,
    });
    return () => {
      setIsMounted(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNewParameters = useCallback(
    async ({
      newBreakoutNumber,
      newXExtent,
      newYExtent,
      maxIterations,
      resolution,
    }: {
      newBreakoutNumber: number;
      newXExtent: [number, number];
      newYExtent: [number, number];
      maxIterations: number;
      resolution: keyof typeof resolutions;
    }) => {
      setIsLoadingDataForDisplay(true);
      const { xResolution, yResolution } = getResolution({
        xExtent: newXExtent,
        yExtent: newYExtent,
        width,
        height,
        resolution,
      });
      const {
        data: newDataForDisplay,
        dimensions,
        xScale,
        yScale,
      } = await worker
        .generateData({
          breakoutNumber: newBreakoutNumber,
          xExtent: newXExtent,
          yExtent: newYExtent,
          xResolution,
          yResolution,
          maxIterations,
          height,
          width,
        })
        .catch((e) => {
          console.error(e);
          throw e;
          // setIsLoadingDataForDisplay(false);
          // return { data: [], dimensions: { width: 0, height: 0 } };
        });

      // check we are still mounted
      if (!isMounted) return;

      setScales({ xScale, yScale });

      setIsLoadingDataForDisplay(false);
      setDataForDisplay(newDataForDisplay);
      setDimensions(dimensions);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worker, height, width]
  );

  const reset = () => {
    setNewParameters({
      newBreakoutNumber: initialBreakoutNumber,
      newXExtent: initialXExtent,
      newYExtent: initialYExtent,
      maxIterations: 100,
      resolution: initialResolution,
    });
    setBreakoutNumber(initialBreakoutNumber);
    setXExtent(initialXExtent);
    setYExtent(initialYExtent);
    setResolution(initialResolution);
  };

  const defferedDataForDisplay = useDeferredValue(dataForDisplay);
  const zoomOnPoint = useCallback(
    (r: number, i: number) => {
      const xRange = xExtent[1] - xExtent[0];
      const yRange = yExtent[1] - yExtent[0];
      const newXExtent: [number, number] = [r - xRange / 4, r + xRange / 4];
      const newYExtent: [number, number] = [i - yRange / 4, i + yRange / 4];
      setNewParameters({
        newBreakoutNumber: breakoutNumber,
        newXExtent,
        newYExtent,
        maxIterations: 100,
        resolution,
      });
      setXExtent(newXExtent);
      setYExtent(newYExtent);
    },
    [breakoutNumber, resolution, setNewParameters, xExtent, yExtent]
  );

  const setNewResolution = useCallback(
    function (event: ChangeEvent<HTMLSelectElement>) {
      const newResolution = event.target.value as keyof typeof resolutions;
      setResolution(newResolution);
      setNewParameters({
        newBreakoutNumber: breakoutNumber,
        newXExtent: xExtent,
        newYExtent: yExtent,
        maxIterations: 100,
        resolution: newResolution,
      });
    },
    [breakoutNumber, setNewParameters, xExtent, yExtent]
  );

  const setNewRenderElement = useCallback(
    function (event: ChangeEvent<HTMLSelectElement>) {
      const newRenderElement = event.target.value as renderElement;
      setRenderElement(newRenderElement);
      setNewParameters({
        newBreakoutNumber: breakoutNumber,
        newXExtent: xExtent,
        newYExtent: yExtent,
        maxIterations: 100,
        resolution,
      });
    },
    [breakoutNumber, resolution, setNewParameters, xExtent, yExtent]
  );

  const setNewBreakoutNumber = useCallback(
    function (event: ChangeEvent<HTMLInputElement>) {
      const newBreakoutNumber = parseInt(event.target.value);
      setBreakoutNumber(newBreakoutNumber);
      setNewParameters({
        newBreakoutNumber,
        newXExtent: xExtent,
        newYExtent: yExtent,
        maxIterations: 100,
        resolution,
      });
    },
    [resolution, setNewParameters, xExtent, yExtent]
  );

  return (
    <div>
      {renderElement === "svg" ? (
        <VisualisationSvg
          dataForDisplay={defferedDataForDisplay}
          height={height}
          width={width}
          pixelHeight={height / dimensions?.height}
          pixelWidth={width / dimensions?.width}
          showTooltip
          zoomOnPoint={zoomOnPoint}
        />
      ) : (
        <VisualisationCanvas
          dataForDisplay={defferedDataForDisplay}
          height={height}
          width={width}
          pixelHeight={height / dimensions?.height}
          pixelWidth={width / dimensions?.width}
          scales={scales}
          zoomOnPoint={zoomOnPoint}
        />
      )}
      {/* when is loading show an overlay over whole screen with greyed out slightly transparent background and an animated spinner in the center. do not allow click events through the overlay */}
      {isLoadingDataForDisplay && (
        <>
          <div className="absolute top-0 left-0 w-full h-full bg-gray-900 bg-opacity-90 flex justify-center items-center">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        </>
      )}
      {/* show info message on first load */}
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
          onChange={setNewResolution}
          value={resolution}
        >
          {Object.keys(resolutions).map((resolution) => (
            <option key={resolution} value={resolution}>
              {resolution}
            </option>
          ))}
        </select>
        {/* select render element */}
        <label className="mx-2 my-1">Render Element</label>
        <select
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
          onChange={setNewRenderElement}
          value={renderElement}
        >
          <option value="svg">SVG</option>
          <option value="canvas">Canvas</option>
        </select>
        {/* select breakout number */}
        <label className="mx-2 my-1">Breakout Number</label>
        <input
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mx-2 my-1"
          onChange={setNewBreakoutNumber}
          type="number"
          value={breakoutNumber}
        />
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

export default MandelbrotSet;
