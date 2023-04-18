// @ts-check
import { range, scaleLinear } from "d3";

/**
 * x axis is the real part of the complex number
 * y axis is the imaginary part of the complex number
 */

/**
 * mandelbrot accepts x, y, and maxIterations
 * @param {object} c
 * @param {number} c.r
 * @param {number} c.i
 * @param {number} c.maxIterations
 * @returns {number}
 */
const mandelbrot = (c) => {
  let z = { x: 0, y: 0 };
  let n = 0;
  while (n < c.maxIterations) {
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

/**
 * generateData accepts xExtent, yExtent, xResolution, yResolution, height, width, and maxIterations
 * @param {object} params
 * @param {[number, number]} params.xExtent
 * @param {[number, number]} params.yExtent
 * @param {number} params.xResolution
 * @param {number} params.yResolution
 * @param {number} params.height
 * @param {number} params.width
 * @param {number} params.maxIterations
 */
export function generateData(params) {
  const {
    xExtent,
    yExtent,
    xResolution,
    yResolution,
    height,
    width,
    maxIterations,
  } = params;
  const yPoints = range(yExtent[0], yExtent[1], yResolution);
  const xPoints = range(xExtent[0], xExtent[1], xResolution);

  const xScale = scaleLinear().domain(xExtent).range([0, width]);
  const yScale = scaleLinear().domain(yExtent).range([0, height]);

  const colorScale = scaleLinear().domain([0, 100]).range([0, 360]);

  const newDataForDisplay = xPoints
    .map((r, xi) =>
      yPoints.map((i, xj) => {
        const x = xi;
        const y = xj;
        const n = mandelbrot({ r, i, maxIterations });
        return {
          x: xScale(r),
          y: yScale(i),
          n,
          r,
          i,
          color: `hsl(${colorScale(n)}, 100%, 50%)`,
        };
      })
    )
    .flat();
  return {
    data: newDataForDisplay,
    dimensions: { width: xPoints.length, height: yPoints.length },
    xScale,
    yScale,
  };
}
