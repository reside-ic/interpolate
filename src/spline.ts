import solveTridiagonal from "solve-tridiagonal";

import {InterpolatorBase} from "./base";

/**
 * Cubic spline interpolation
 */
export class InterpolatorSpline extends InterpolatorBase {
    private _k: number[][];
    private _yMat: number[][];
    constructor(x: number[], y: number[]) {
        super(x, y);
        this._yMat = [];
        const nX = this.nX;
        for (let i = 0; i < this.nY; ++i) {
            this._yMat.push(y.slice(i * nX, (i + 1) * nX));
        }
        const A = splineCalcA(this._x);
        const B = splineCalcB(this._x, this._yMat);
        this._k = splineCalcK(A, B); // k actually the same as B
    }

    public eval(x: number) {
        const i = this.search(x, false);
        const y = Array(this.nY);
        for (let j = 0; j < this.nY; ++j) {
            y[j] = splineEval(i, x, this._x, this._yMat[j], this._k[j]);
        }
        return y;
    }
}

function splineEval(i: number, x: number, xs: number[], ys: number[],
                    ks: number[]) {
    const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
    const a =  ks[i] * (xs[i + 1] - xs[i]) - (ys[i + 1] - ys[i]);
    const b = -ks[i + 1] * (xs[i + 1] - xs[i]) + (ys[i + 1] - ys[i]);
    return (1 - t) * ys[i] + t * ys[i + 1] +
        t * (1 - t) * (a * (1 - t) + b * t);
}

function splineCalcA(x: number[]) {
    const n = x.length;
    const A0 = Array(n);
    const A1 = Array(n);
    const A2 = Array(n);
    const nm1 = n - 1;

    A0[0] = 0; // will be ignored
    A1[0] = 2 / (x[1] - x[0]);
    A2[0] = 1 / (x[1] - x[0]);
    for (let i = 1; i < nm1; ++i) {
        A0[i] = 1 / (x[i] - x[i - 1]);
        A1[i] = 2 * (1 / (x[i] - x[i - 1]) + 1 / (x[i + 1] - x[i]));
        A2[i] = 1 / (x[i + 1] - x[i]);
    }
    A0[nm1] = 1 / (x[nm1] - x[nm1 - 1]);
    A1[nm1] = 2 / (x[nm1] - x[nm1 - 1]);
    A2[nm1] = 0; // will be ignored

    return [A0, A1, A2];
}

function splineCalcB(x: number[], y: number[][]) {
    const n = x.length;
    const ny = y.length;
    const nm1 = n - 1;
    const B = [];
    for (let j = 0; j < ny; ++j) {
        const bj = Array(n);
        const yj = y[j];
        bj[0] = 3 * (yj[1] - yj[0]) / ((x[1] - x[0]) * (x[1] - x[0]));
        for (let i = 1; i < nm1; ++i) {
            bj[i] = 3 *
                ((yj[i]     - yj[i - 1]) / ((x[i    ] - x[i - 1]) * (x[i    ] - x[i - 1])) +
                 (yj[i + 1] - yj[i    ]) / ((x[i + 1] - x[i    ]) * (x[i + 1] - x[i    ])));
        }
        bj[nm1] = 3 *
            (yj[nm1] - yj[nm1 - 1]) / ((x[nm1] - x[nm1 - 1]) * (x[nm1] - x[nm1 - 1]));
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

function solve(n: number, a: number[], b: number[], c: number[],
               x: number[]) {
    if (!solveTridiagonal(n, a, b, c, x)) {
        throw Error("solve failed");
    }
}
