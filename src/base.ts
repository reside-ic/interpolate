/** Base class for interpolators */
export abstract class InterpolatorBase {
    /** Number of 'x' points in the system */
    public readonly nX: number;
    /** Number of series per 'x' */
    public readonly nY: number;

    protected _i: number;
    protected readonly _x: readonly number[];
    protected readonly _y: readonly number[][];

    /**
     * @param x The x (often time) variables that form the domain of
     * interpolation
     *
     * @param y An array of variables to interpolate, the same length
     * as `x`, or a multiple of its length.
     */
    constructor(x: number[], y: number[][]) {
        // TODO: cope with y as number[]
        //
        // TODO: clone deeply?, or provide recalculate method to work
        // with splines
        this._i = 0;
        this._x = x;
        this._y = y;
        this.nX = this._x.length;
        this.nY = this._y[0].length;
    }

    /** Evaluate the interpolation function
     *
     * @param x The x position to interpolate the function at
     */
    public abstract eval(x: number, series: number): number;

    protected search(target: number, allowRight: boolean) {
        const i = interpolateSearch(target, this._x, this._i);
        if (i < 0 || (!allowRight && i === this.nX)) { // off the lhs only
            throw Error("Interpolation failed as 'x' is out of range");
        }
        this._i = i;
        return i;
    }
}

export function interpolateSearch(target: number, x: readonly number[],
                                  prev: number) {
    let i0 = prev;
    let i1 = prev;
    let inc = 1;
    const n = x.length;

    if (x[i0] <= target) { // advance up until we hit the top
        if (i0 >= n - 1) { // guess is already *at* the top.
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
        if (i0 === 0) { // guess is already at the bottom
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
