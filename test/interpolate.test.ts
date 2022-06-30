import {interpolateSearch} from "../src/interpolate";

// look in odin:tests/testthat/test-js-support-interpolate.R for test cases
describe("interpolateSearch can find points", () => {
    const x = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];
    it("Can find point", () => {
        const res = interpolateSearch(0, x, 0);
        expect(res).toEqual(-1);
    });
});
