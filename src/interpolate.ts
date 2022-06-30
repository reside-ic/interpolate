/** Base class for interpolators */
export abstract class InterpolatorBase {
    protected _i: number;
    protected _x: number[];
    protected _y: number[];
    /** Number of 'x' points in the system */
    readonly nX: number;
    /** Number of series per 'x' */
    readonly nY: number;

    /**
     * @param x The x (often time) variables that form the domain of
     * interpolation
     *
     * @param y An array of variables to interpolate, the same length
     * as `x`, or a multiple of its length.
     */
    constructor(x: number[], y: number[]) {
        if (y.length === 0 || y.length % x.length !== 0) {
            throw Error("'y.length' must be multiple of 'x.length'");
        }
        this._i = 0;
        this._x = x.slice();
        this._y = y.slice();
        this.nX = this._x.length;
        this.nY = this._y.length / this.nX;
    }

    protected search(target: number) {
        this._i = interpolateSearch(target, this._x, this._i);
        return this._i;
    }

    /** Evaluate the interpolation function
     *
     * @param x The x position to interpolate the function at
     */
    public abstract eval(x: number): number[];
}

/**
 * Piecewise-constant interpolation, with open right interval
 */
export class InterpolatorConstant extends InterpolatorBase {
    public eval(x: number) {
        let i = Math.max(this.search(x), this.nX - 1);
        if (i < 0) { // off the lhs only
            throw Error(`Interpolation failed as ${x} is out of range`);
        }

        // NOTE: In the R function 'approx' there is an argument 'f' that
        // deals with the 'ties' case more gracefully.  This is like the
        // default f=0, omitting this becomes like the option f=1.
        if (i != this.nX - 1 && this._x[i + 1] == x) {
            ++i;
        }

        const y = Array(this.nY);
        for (let j = 0; j < this.nY; ++j) {
            const k = i + j * this.nX;
            y[i] = this._y[k];
        }

        return y;
    }
}

/**
 * Piecewise-linear interpolation
 */
export class InterpolatorLinear extends InterpolatorBase {
    public eval(x: number) {
        const i = this.search(x);
        if (i < 0 || i == this.nX) { // off the lhs or rhs
            throw Error(`Interpolation failed as ${x} is out of range`);
        }

        const x0 = this._x[i];
        const x1 = this._x[i + 1];
        const scal = (x - x0) / (x1 - x0);
        const y = Array(this.nY);
        for (let j = 0; j < this.nY; ++j) {
            const k = i + j * this.nX;
            const y0 = this._y[k];
            const y1 = this._y[k + 1];
            y[j] = y0 + (y1 - y0) * scal;
        }

        return y;
    }
}

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
        var i = this.search(x);
        if (i < 0 || i == this.nX) { // off the lhs or rhs
            throw Error(`Interpolation failed as ${x} is out of range`);
        }
        const y = Array(this.nY);
        for (let j = 0; j < this.nY; ++j) {
            y[j] = splineEval(i, x, this._x, this._yMat[j], this._k[j]);
        }
        return y;
    }
}

export function interpolateSearch(target: number, x: number[], prev: number) {
    let i0 = prev;
    let i1 = prev;
    let inc = 1;
    const n = x.length;

    if (x[i0] <= target) { // advance up until we hit the top
        if (i0 >= n - 1) { // guess is already *at* the top.
            // This exit is left in here to avoid the possibility of an
            // infinite loop or reading out of range, but should not be
            // necessary unless the object has been tampered with because we
            // always set the guess to the lower bound of our guess for 'i'.
            // This bit of code is derived from something in `ring`, where
            // this was dynamic, but it makes for a fairly cheap safety
            // check.
            return n;
        }
        i1 = i0 + inc;
        while (x[i1] < target) {
            i0 = i1;
            inc *= 2;
            i1 += inc;
            if (i1 >= n) { // off the end of the buffer
                i1 = n - 1;
                if (x[i1] < target) {
                    return n;
                }
                break;
            }
        }
    } else { // advance down
        if (i0 == 0) { // guess is already at the bottom
            return -1;
        }
        i0 = i0 - inc;
        while (x[i0] > target) {
            i1 = i0;
            inc *= 2;
            if (i0 < inc) {
                i0 = 0;
                if (x[i0] > target) {
                    return -1;
                }
                break;
            }
            i0 -= inc;
        }
    }

    while (i1 - i0 > 1) {
        const i2 = Math.floor((i1 + i0) / 2);
        if (x[i2] < target) {
            i0 = i2;
        } else {
            i1 = i2;
        }
    }

    return i0;
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
