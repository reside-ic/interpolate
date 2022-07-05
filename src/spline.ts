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
        for (var i = 0; i < this.nY; ++i) {
            this._yMat.push(y.slice(i * nX, (i + 1) * nX));
        }
        const A = splineCalcA(this._x);
        const B = splineCalcB(this._x, this._yMat);
        this._k = splineCalcK(A, B); // k actually the same as B
    }

    public eval(x: number) {
        var i = this.search(x, false);
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
    A0[nm1] = 1 / (x[nm1] - x[nm1-1]);
    A1[nm1] = 2 / (x[nm1] - x[nm1-1]);
    A2[nm1] = 0; // will be ignored

    return [A0, A1, A2];
}

function splineCalcB(x: number[], y: number[][]) {
    const n = x.length;
    const ny = y.length;
    const nm1 = n - 1;
    const B = [];
    for (let j = 0; j < ny; ++j) {
        const Bj = Array(n);
        const yj = y[j];
        Bj[0] = 3 * (yj[1] - yj[0]) / ((x[1] - x[0]) * (x[1] - x[0]));
        for (let i = 1; i < nm1; ++i) {
            Bj[i] = 3 *
                ((yj[i]   - yj[i-1]) / ((x[i  ] - x[i-1]) * (x[i  ] - x[i-1])) +
                 (yj[i+1] - yj[i  ]) / ((x[i+1] - x[i  ]) * (x[i+1] - x[i  ])));
        }
        Bj[nm1] = 3 *
            (yj[nm1] - yj[nm1-1]) / ((x[nm1] - x[nm1-1]) * (x[nm1] - x[nm1-1]));
        B.push(Bj);
    }
    return B;
}

function splineCalcK(A: number[][], B: number[][]) {
    var a = A[0], b = A[1], c = A[2];
    var n = a.length;
    for (var i = 0; i < B.length; ++i) {
        solveTridiagonal(n, a, b, c, B[i]);
    }
    return B;
}

function solveTridiagonal(n: number, a: number[], b: number[], c: number[],
                          x: number[]) {
    b = b.slice();
    // Eliminate:
    for (let i = 1; i < n; ++i) {
        if (b[i - 1] === 0) {
            throw Error("solve failed due to lack of diagonal dominance");
        }
        const fac = a[i] / b[i - 1];
        b[i] -= fac * c[i - 1];
        x[i] -= fac * x[i - 1];
    }

    // Back-substitute:
    if (b[n - 1] === 0) {
        throw Error("solve failed due to singular matrix");
    }
    x[n - 1] /= b[n - 1];
    for (let i = n - 2; i >= 0; i--) {
        if (b[i] === 0) {
            throw Error("solve failed due to singular matrix");
        }
        x[i] = (x[i] - c[i] * x[i + 1]) / b[i];
    }
    return x;
}
