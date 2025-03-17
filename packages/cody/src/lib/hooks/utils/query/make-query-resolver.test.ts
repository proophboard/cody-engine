import {makePartialSelect} from "@cody-engine/cody/hooks/utils/query/make-query-resolver";
import {PartialSelect} from "@event-engine/infrastructure/DocumentStore";
import {Filter} from "@app/shared/value-object/query/filter-types";
import {makeNodeRecord, Node, NodeType} from "@proophboard/cody-types";
import {Context} from "@cody-engine/cody/hooks/context";
import {FsTree} from "nx/src/generators/tree";
import {Map} from "immutable";

type PartialSelectWithClientAnd = PartialSelect & {on: {and?: Filter}}

const testNode = makeNodeRecord({
  name: "Test",
  type: NodeType.document,
  id: "12344",
  metadata: `{"ns": "App", "schema": {}}`,
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

const ctx: Context = {beSrc: "", feSrc: "", service: "Cody", boardId: "11111", boardName: "Test Board", sharedSrc: "", tree: () => new FsTree("", true), projectRoot: ".", userId: "333", syncedNodes: (Map().set(testNode.getId(), testNode)) as Map<string, Node>, codeGeneration: {fe: {pages: true, reactComponents: true, reactHooks: true}, be: {eventApplyLogic: true, resolverLogic: true, businessLogic: true, policyLogic: true}}}


describe("makePartialSelect", () => {
  test("simple select", () => {
    const lines: string[] = [];

    makePartialSelect(["propA", "propB"], lines, testNode, ctx, '    ');

    expect(lines.join("\n")).toEqual(`    [
      'propA',
      'propB',
    ]`)
  })

  test("select with lookup", () => {
    const lines: string[] = [];

    makePartialSelect([
      "propA",
      "propB",
      {
        lookup: "/App/Test",
        alias: "my_alias",
        using: "other_alias",
        optional: true,
        on: {
          localKey: "propA",
          foreignKey: "refB",
          and: {
            eq: {
              prop: "refC",
              value: "X"
            }
          }
        },
        select: [
          {
            field: "myProp",
            alias: "foreign.myProp"
          }
        ]
      }
    ] as PartialSelectWithClientAnd, lines, testNode, ctx, '    ');

    expect(lines.join("\n")).toEqual(`    [
      'propA',
      'propB',
      {
        lookup: 'Cody.App.Test',
        alias: 'my_alias',
        using: 'other_alias',
        optional: true,
        on: {
          localKey: 'propA',
          foreignKey: 'refB',
          and:
            new filters.EqFilter('refC', await jexl.eval(\`X\`, ctx)),
        },
        select:
          [
            {
              field: 'myProp',
              alias: 'foreign.myProp',
            },
          ],
      },
    ]`)
  })
})
