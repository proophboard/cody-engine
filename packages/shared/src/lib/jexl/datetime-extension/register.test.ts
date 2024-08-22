import jexl from "@app/shared/jexl/get-configured-jexl";

describe("DateTime Jexl extensions", () => {
  test("It's possible to add a day to a date", () => {
    const val = jexl.evalSync("('2024-08-22'|addDays(1)|isoDate()");

    expect(val).toEqual('2024-08-23')
  })
})
