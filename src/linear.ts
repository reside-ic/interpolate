import {InterpolatorBase} from "./base";

/**
 * Piecewise-linear interpolation
 */
export class InterpolatorLinear extends InterpolatorBase {
    public eval(x: number) {
        const i = this.search(x, false);

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
