import jexl from "@app/shared/jexl/get-configured-jexl";

describe("jexl type cast transforms", () => {
  test("it casts to string", () => {
    const val = jexl.evalSync("1|toStr()");

    expect(val).toEqual("1");
  })

  test("it casts Error to string", () => {
    const error = Error('Failed to do something');
    const val = jexl.evalSync(`error|toStr()`, {error});

    expect(val).toEqual("Failed to do something");
  });

  test("it casts to integer", () => {
    const val = jexl.evalSync("'1 day'|toInt()");

    expect(val).toEqual(1);
  })

  test("it casts to array", () => {
    const val = jexl.evalSync("123|toArray()");

    expect(val).toEqual([123]);
  })
});
