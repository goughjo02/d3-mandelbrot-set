"use client";

import { createWorkerFactory, useWorker } from "@shopify/react-web-worker";
import { extent } from "d3";
import {
  ChangeEvent,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useState,
} from "react";
import Visualisation from "./Visualisation";

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
  color: string;
}

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

export const MandelbrotSet = () => {
  const [resolution, setResolution] = useState<keyof typeof resolutions>("low");

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

  useEffect(() => {
    setNewParameters({
      xExtent: initialXExtent,
      yExtent: initialYExtent,
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
      xExtent,
      yExtent,
      maxIterations,
      resolution,
    }: {
      xExtent: [number, number];
      yExtent: [number, number];
      maxIterations: number;
      resolution: keyof typeof resolutions;
    }) => {
      setIsLoadingDataForDisplay(true);
      const { xResolution, yResolution } = getResolution({
        xExtent,
        yExtent,
        width,
        height,
        resolution,
      });
      const { data: newDataForDisplay, dimensions } = await worker
        .generateData({
          xExtent,
          yExtent,
          xResolution,
          yResolution,
          maxIterations,
          height,
          width,
        })
        .catch((e) => {
          console.error(e);
          // setIsLoadingDataForDisplay(false);
          return { data: [], dimensions: { width: 0, height: 0 } };
        });

      // check we are still mounted
      if (!isMounted) return;

      setIsLoadingDataForDisplay(false);
      setDataForDisplay(newDataForDisplay);
      setDimensions(dimensions);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [worker, height, width]
  );

  const reset = () => {
    setNewParameters({
      xExtent: initialXExtent,
      yExtent: initialYExtent,
      maxIterations: 100,
      resolution: "low",
    });
  };

  const defferedDataForDisplay = useDeferredValue(dataForDisplay);
  const zoomOnPoint = useCallback(
    (r: number, i: number) => {
      const xExtent = extent(dataForDisplay, (d) => d.r) as [number, number];
      const yExtent = extent(dataForDisplay, (d) => d.i) as [number, number];
      const xRange = xExtent[1] - xExtent[0];
      const yRange = yExtent[1] - yExtent[0];
      const newXExtent: [number, number] = [r - xRange / 4, r + xRange / 4];
      const newYExtent: [number, number] = [i - yRange / 4, i + yRange / 4];
      setNewParameters({
        xExtent: newXExtent,
        yExtent: newYExtent,
        maxIterations: 100,
        resolution,
      });
    },
    [dataForDisplay, resolution, setNewParameters]
  );

  const setNewResolution = useCallback(
    function (event: ChangeEvent<HTMLSelectElement>) {
      const newResolution = event.target.value as keyof typeof resolutions;
      setResolution(newResolution);
      setNewParameters({
        xExtent: initialXExtent,
        yExtent: initialYExtent,
        maxIterations: 100,
        resolution: newResolution,
      });
    },
    [setNewParameters]
  );

  return (
    <div>
      <Suspense fallback={<div>Loading svg...</div>}>
        <Visualisation
          dataForDisplay={defferedDataForDisplay}
          height={height}
          width={width}
          pixelHeight={height / dimensions?.height}
          pixelWidth={width / dimensions?.width}
          showTooltip={false}
          zoomOnPoint={zoomOnPoint}
        />
      </Suspense>
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

export default MandelbrotSet;
