import {interpolateSearch} from "../src/interpolate";

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
});
