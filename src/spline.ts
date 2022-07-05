import solveTridiagonal from "solve-tridiagonal";

import {InterpolatorBase} from "./base";

/**
 * Cubic spline interpolation, with "natural" boundary conditions (see
 * docs for R's `?spline`). Compared with the other interpolation
 * objects ({@link InterpolatorConstant} and {@link
 * InterpolatorLinear}) here we have to do some set up after
 * initialisation to prepare the coefficients of the system. The
 * actual interpolation via {@link InterpolatorSpline.eval} is not
 * much complex than linear interepolation though.
 */
export class InterpolatorSpline extends InterpolatorBase {
    private _k: number[][];
    constructor(x: number[], y: number[] | number[][]) {
        super(x, y);
        const A = splineCalcA(this._x);
        const B = splineCalcB(this._x, this._y);
        this._k = splineCalcK(A, B);
    }

    public eval(x: number, series: number = 0) {
        const i = this.search(x, false);
        const y = Array(this.nY);
        return splineEval(i, x, this._x, this._y[series], this._k[series]);
    }
}

function splineEval(i: number, x: number, xs: readonly number[],
                    ys: readonly number[], ks: readonly number[]) {
    const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
    const a =  ks[i] * (xs[i + 1] - xs[i]) - (ys[i + 1] - ys[i]);
    const b = -ks[i + 1] * (xs[i + 1] - xs[i]) + (ys[i + 1] - ys[i]);
    return (1 - t) * ys[i] + t * ys[i + 1] +
        t * (1 - t) * (a * (1 - t) + b * t);
}

function splineCalcA(x: readonly number[]) {
    const n = x.length;
    const A0 = Array(n);
    const A1 = Array(n);
    const A2 = Array(n);

    // Left boundary
    A0[0] = 0; // will be ignored
    A1[0] = 2 / (x[1] - x[0]);
    A2[0] = 1 / (x[1] - x[0]);
    // Middle elements
    for (let i = 1; i < n - 1; ++i) {
        const x0 = x[i - 1];
        const x1 = x[i];
        const x2 = x[i + 1];
        A0[i] = 1 / (x1 - x0);
        A1[i] = 2 * (1 / (x1 - x0) + 1 / (x2 - x1));
        A2[i] = 1 / (x2 - x1);
    }
    // Right boundary
    A0[n - 1] = 1 / (x[n - 1] - x[n - 2]);
    A1[n - 1] = 2 / (x[n - 1] - x[n - 2]);
    A2[n - 1] = 0; // will be ignored

    return [A0, A1, A2];
}

function splineCalcB(x: readonly number[], y: readonly number[][]) {
    const n = x.length;
    const ny = y.length;
    const nm1 = n - 1;
    const B = [];
    for (let j = 0; j < ny; ++j) {
        const bj = Array(n);
        const yj = y[j];
        // Left boundary
        bj[0] = 3 * (yj[1] - yj[0]) / ((x[1] - x[0]) ** 2);
        // Middle elements
        for (let i = 1; i < nm1; ++i) {
            const x0 = x[i - 1];
            const x1 = x[i];
            const x2 = x[i + 1];
            const yj0 = yj[i - 1];
            const yj1 = yj[i];
            const yj2 = yj[i + 1];
            bj[i] = 3 * ((yj1 - yj0) / ((x1 - x0) ** 2) +
                         (yj2 - yj1) / ((x2 - x1) ** 2));
        }
        // Right boundary
        bj[nm1] = 3 * (yj[nm1] - yj[nm1 - 1]) / ((x[nm1] - x[nm1 - 1]) ** 2);

        B.push(bj);
    }
    return B;
}

function splineCalcK(A: number[][], B: number[][]) {
    const a = A[0];
    const b = A[1];
    const c = A[2];
    const n = a.length;
    for (const x of B) {
        solve(n, a, b.slice(), c, x);
    }
    return B;
}

// Exported just so that we can test that it throws as expected, not
// exported from the package.
export function solve(n: number, a: number[], b: number[], c: number[],
                      x: number[]) {
    if (!solveTridiagonal(n, a, b, c, x)) {
        throw Error("solve failed: singular matrix?");
    }
}
