import {add} from "../src/index";

describe("can add numbers", () => {
    it("adds two numbers", () => {
        expect(add(1, 2)).toEqual(3);
    })
});
