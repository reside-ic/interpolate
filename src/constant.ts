import {InterpolatorBase} from "./base";

/**
 * Piecewise-constant interpolation, with open right interval
 */
export class InterpolatorConstant extends InterpolatorBase {
    public eval(x: number, series: number = 0) {
        let i = Math.min(this.search(x, true), this.nX - 1);

        // NOTE: In the R function 'approx' there is an argument 'f' that
        // deals with the 'ties' case more gracefully.  This is like the
        // default f=0, omitting this becomes like the option f=1.
        if (i !== this.nX - 1 && this._x[i + 1] === x) {
            ++i;
        }

        return this._y[series][i];
    }
}
