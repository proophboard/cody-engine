import {execMappingAsync, execMappingSync} from "@cody-play/infrastructure/rule-engine/make-executable";

const source = {propA: "a", propB: "b"};

describe("execMappingSync", () => {
  test("map string expr", () => {
    const target = execMappingSync("source", {source});

    expect(target).toEqual(source);
  })

  test("map obj expr", () => {
    const target = execMappingSync({
      propA: "source.propA",
      propB: "source.propB"
    }, {source});

    expect(target).toEqual(source);
  })

  test("map nested obj expr", () => {
    const target = execMappingSync({
      target: {
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {source});

    expect(target).toEqual({target: source});
  })

  test("map nested obj with merge expr", () => {
    const target = execMappingSync({
      target: {
        $merge: "{propC: 'c'}",
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", ...source});
  })

  test("map nested obj with merge array expr", () => {
    const target = execMappingSync({
      target: {
        $merge: ["{propC: 'c'}", "{propD: 'd'}"],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", propD: "d", ...source});
  })

  test("map nested obj with merge array objs expr", () => {
    const target = execMappingSync({
      target: {
        $merge: [{propC: "'c'"}, {propD: "'d'"}],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", propD: "d", ...source});
  })
});

describe("execMappingAsync", () => {
  test("map string expr", async () => {
    const target = await execMappingAsync("source", {source});

    expect(target).toEqual(source);
  }, 100)

  test("map obj expr", async () => {
    const target = await execMappingAsync({
      propA: "source.propA",
      propB: "source.propB"
    }, {source});

    expect(target).toEqual(source);
  }, 100)

  test("map nested obj expr", async () => {
    const target = await execMappingAsync({
      target: {
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {source});

    expect(target).toEqual({target: source});
  }, 100)

  test("map nested obj with merge expr", async () => {
    const target = await execMappingAsync({
      target: {
        $merge: "{propC: 'c'}",
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", ...source});
  }, 100)

  test("map nested obj with merge array expr", async () => {
    const target = await execMappingAsync({
      target: {
        $merge: ["{propC: 'c'}", "{propD: 'd'}"],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", propD: "d", ...source});
  }, 100)

  test("map nested obj with merge array objs expr", async () => {
    const target = await execMappingAsync({
      target: {
        $merge: [{propC: "'c'"}, {propD: "'d'"}],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, {propC: "c", propD: "d", ...source});
  }, 100)
});
