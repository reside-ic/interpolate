import {InterpolatorBase} from "./base";

/**
 * Piecewise-linear interpolation
 */
export class InterpolatorLinear extends InterpolatorBase {
    public eval(x: number, series: number = 0) {
        const i = this.search(x, false);
        const x0 = this._x[i];
        const x1 = this._x[i + 1];
        const scal = (x - x0) / (x1 - x0);
        const y = this._y[series];
        const y0 = y[i];
        const y1 = y[i + 1];
        return y0 + (y1 - y0) * scal;
    }
}
