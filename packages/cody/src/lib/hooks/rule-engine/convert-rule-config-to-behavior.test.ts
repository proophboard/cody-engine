import {
  convertMapping,
  wrapExpression
} from "@cody-engine/cody/hooks/rule-engine/convert-rule-config-to-behavior";
import {makeNodeRecord, NodeType} from "@proophboard/cody-types";
import {Rule} from "@app/shared/rule-engine/configuration";
import {Context} from "@cody-engine/cody/hooks/context";
import {FsTree} from "nx/src/generators/tree";
import {Map} from "immutable";

const testNode = makeNodeRecord({
  name: "Test",
  type: NodeType.command,
  id: "12344",
  metadata: "{}",
  link: "",
  childrenList: [],
  layer: false,
  tags: [],
  parent: null,
  defaultLayer: false,
  geometry: {x: 0, y: 0},
  description: "",
  sourcesList: [],
  targetsList: []
});

const rule: Rule = {
  rule: "always",
  then: {
    assign: {variable: "test", value: ""}
  }
}

const source = {propA: "a", propB: "b"};

const ctx: Context = {beSrc: "", feSrc: "", boardId: "11111", boardName: "Test Board", sharedSrc: "", tree: new FsTree("", true), projectRoot: ".", userId: "333", syncedNodes: Map()}

describe("wrapExpression", () => {
  test("sync eval", () => {
    const expr = wrapExpression("'test'", true);

    expect(expr).toEqual(`jexl.evalSync(\`'test'\`, ctx)`);
  })

  test("expr with double quotes", () => {
    const expr = wrapExpression("['a','b','c']|filter('item == \"a\"')", true);

    expect(expr).toEqual(`jexl.evalSync(\`['a','b','c']|filter('item == "a"')\`, ctx)`);
  })
})

describe("convertMapping", () => {
  test("map string expr", () => {
    const target = convertMapping(testNode, ctx, "source", rule, "", true);

    expect(target).toEqual("jexl.evalSync(`source`, ctx)");
  })


  test("map obj expr", () => {
    const target = convertMapping(testNode, ctx, {
      propA: "source.propA",
      propB: "source.propB"
    }, rule, "", true);

    expect(target).toEqual("{\n  \"propA\": jexl.evalSync(`source.propA`, ctx),\n  \"propB\": jexl.evalSync(`source.propB`, ctx),\n}");
  })


  test("map nested obj expr", () => {
    const target = convertMapping(testNode, ctx, {
      target: {
        propA: "source.propA",
        propB: "source.propB"
      }
    }, rule, "", true);

    expect(target).toEqual("{\n  \"target\": {\n    \"propA\": jexl.evalSync(`source.propA`, ctx),\n    \"propB\": jexl.evalSync(`source.propB`, ctx),\n  },\n}");
  })

  test("map nested objs in array expr", () => {
    const target = convertMapping(testNode, ctx, [{
      target: {
        propA: "source.propA",
        propB: "source.propB"
      }
    }], rule, "", true);

    expect(target).toEqual("[\n  {\n    \"target\": {\n      \"propA\": jexl.evalSync(`source.propA`, ctx),\n      \"propB\": jexl.evalSync(`source.propB`, ctx),\n    },\n  },\n]");
  })

  test("map nested obj with merge expr", () => {
    const target = convertMapping(testNode, ctx, {
      target: {
        $merge: "{propC: 'c'}",
        propA: "source.propA",
        propB: "source.propB"
      }
    }, rule, "", true);

    expect(target).toEqual("{\n  \"target\": {\n    ...jexl.evalSync(`{propC: 'c'}`, ctx),\n    \"propA\": jexl.evalSync(`source.propA`, ctx),\n    \"propB\": jexl.evalSync(`source.propB`, ctx),\n  },\n}");
  })

  test("map nested obj with merge array expr", () => {
    const target = convertMapping(testNode, ctx, {
      target: {
        $merge: ["{propC: 'c'}", "{propD: 'd'}"],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, rule, "", true);

    expect(target).toEqual("{\n  \"target\": {\n    ...jexl.evalSync(`{propC: 'c'}`, ctx),\n    ...jexl.evalSync(`{propD: 'd'}`, ctx),\n    \"propA\": jexl.evalSync(`source.propA`, ctx),\n    \"propB\": jexl.evalSync(`source.propB`, ctx),\n  },\n}");
  })

  test("map nested obj with merge array objs expr", () => {
    const target = convertMapping(testNode, ctx, {
      target: {
        $merge: [{propC: "'c'"}, {propD: "'d'"}],
        propA: "source.propA",
        propB: "source.propB"
      }
    }, rule, "", true);

    expect(target).toEqual("{\n  \"target\": {\n    ...{\n      \"propC\": jexl.evalSync(`'c'`, ctx),\n    },\n    ...{\n      \"propD\": jexl.evalSync(`'d'`, ctx),\n    },\n    \"propA\": jexl.evalSync(`source.propA`, ctx),\n    \"propB\": jexl.evalSync(`source.propB`, ctx),\n  },\n}");
  })
})
