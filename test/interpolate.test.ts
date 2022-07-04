import {interpolateSearch} from "../src/base";
import {InterpolatorConstant} from "../src/constant";
import {InterpolatorLinear} from "../src/linear";
import {InterpolatorSpline} from "../src/spline";

// look in odin:tests/testthat/test-js-support-interpolate.R for test cases
describe("interpolateSearch can find points", () => {
    it("Can find point", () => {
        const x = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
        expect(interpolateSearch(0,  x, 0)).toEqual(-1);
        expect(interpolateSearch(10, x, 0)).toEqual(10);
        expect(interpolateSearch(0,  x, 5)).toEqual(-1);
        expect(interpolateSearch(10, x, 5)).toEqual(10);
        expect(interpolateSearch(0,  x, 9)).toEqual(-1);
        expect(interpolateSearch(10, x, 9)).toEqual(10);
    });

    it("Can find points in trivial vector", () => {
        const x = 0.5;
        expect(interpolateSearch(0,        [x], 0)).toEqual(-1);
        expect(interpolateSearch(x,        [x], 0)).toEqual(1);
        expect(interpolateSearch(x + 1e-7, [x], 0)).toEqual(1);
        // The previous interface satisfied this, but I think this
        // might have been a serialisation issue:
        // expect(interpolateSearch(x - 1e-7, [x], 0)).toEqual(1);
    });

    it("Copes with previous corner case", () => {
        const x = [
            0.084133944562211, 0.388214586787225, 0.788885934185673,
            1.10933879337353, 1.26720494581815, 1.29417642265985,
            1.33293077275123, 1.66824013118334, 1.67899697952353,
            2.13847581530135, 2.33812341864825, 2.38783145563323,
            2.40261439350479, 2.4133948387136, 2.42602639316569,
            3.12713656526426, 3.59934383578104, 3.95284011716578,
            4.09458703214518, 4.15191498077006, 4.31669185581687,
            4.50893006728715, 4.8370562989932, 4.88483239173352,
            5.46442874361944, 5.64474886871073, 5.70643784196122,
            5.87292617462855, 5.93556976775707, 6.23232980114077];
        const target = 4.69528083699613;
        expect(interpolateSearch(target, x, 0)).toEqual(21);
    });
});

/* r code for the example
  x <- 0:6
  y <- c(0.66, 0.905, 0.731, 0.638, 0.087, 0.382, 0.285)
  z <- c(0.04, 1.57, 2.06, 2.87, 3.75, 4.55, 5.56)
  dput(approx(x, y, z, "constant")$y)

*/
describe("Constant interpolation of a single trace", () => {
    const x = [0, 1, 2, 3, 4, 5, 6];
    const y = [0.66, 0.905, 0.731, 0.638, 0.087, 0.382, 0.285];
    const z = [0.04, 1.57, 2.06, 2.87, 3.75, 4.55, 5.56];
    const expected = [0.66, 0.905, 0.731, 0.731, 0.638, 0.087, 0.382];
    const obj = new InterpolatorConstant(x, [y]);

    it("returns change points correctly", () => {
        for (let i = 0; i < x.length; ++i) {
            expect(obj.eval(x[i])).toEqual(y[i]);
        };
    });

    it("returns midpoints correctly", () => {
        for (let i = 0; i < x.length - 1; ++i) {
            expect(obj.eval(x[i] + 0.5)).toBeCloseTo(y[i]);
        }
    });

    it("returns other points correctly", () => {
        for (let i = 0; i < z.length; ++i) {
            expect(obj.eval(z[i])).toBeCloseTo(expected[i]);
        }
    });
});

/* r code for the example:

  x <- 0:6
  y <- c(0.66, 0.905, 0.731, 0.638, 0.087, 0.382, 0.285)
  z <- c(0.04, 1.57, 2.06, 2.87, 3.75, 4.55, 5.56)
  dput(approx(x, y, z)$y)
 */
describe("Linear interpolation of a single trace", () => {
    const x = [0, 1, 2, 3, 4, 5, 6];
    const y = [0.66, 0.905, 0.731, 0.638, 0.087, 0.382, 0.285];
    const z = [0.04, 1.57, 2.06, 2.87, 3.75, 4.55];
    const expected = [0.6698, 0.80582, 0.72542, 0.65009, 0.22475, 0.24925];
    const obj = new InterpolatorLinear(x, [y]);
    it("returns change points correctly", () => {
        for (let i = 0; i < x.length; ++i) {
            expect(obj.eval(x[i])).toBeCloseTo(y[i]);
        }
    });

    it("returns midpoints correctly", () => {
        for (let i = 0; i < x.length - 1; ++i) {
            expect(obj.eval(x[i] + 0.5)).toBeCloseTo(
                (y[i] + y[i + 1]) / 2);
        }
    });

    it("returns other points correctly", () => {
        for (let i = 0; i < z.length; ++i) {
            expect(obj.eval(z[i])).toBeCloseTo(expected[i]);
        }
    });

    it ("errors on extrapolation", () => {
        expect(() => obj.eval(0 - 1e-5)).toThrow(
            "Interpolation failed");
        expect(() => obj.eval(6 + 1e-5)).toThrow(
            "Interpolation failed");
    });
});

// describe("Linear interpolation of multiple traces", () => {
//     const x = [0, 1, 2, 3, 4];
//     const y = [[0.38, 0.93, 0.73, 0.93, 0.82],
//                [0.13, 0.15, 0.16, 0.94, 0.47]];
//     it("requires correct length inputs", () => {
//         expect(() => new InterpolatorLinear(x, y.slice(1))).toThrow(
//             "'y.length' must be multiple of 'x.length'");
//     });

//     it("returns a vector of length 2", () => {
//         const obj = new InterpolatorLinear(x, y);
//         const z = obj.eval(1);
//         expect(z[0]).toBeCloseTo(y[1]);
//         expect(z[1]).toBeCloseTo(y[6]);
//     });
// });

describe("Spline interpolation of a single trace", () => {
    const x = [0, 1, 2, 3, 4, 5, 6];
    const y = [0.66, 0.905, 0.731, 0.638, 0.087, 0.382, 0.285];
    const obj = new InterpolatorSpline(x, [y]);
    it("returns change points correctly", () => {
        for (let i = 0; i < x.length; ++i) {
            expect(obj.eval(x[i])).toBeCloseTo(y[i]);
        }
    });
});
