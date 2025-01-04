import {makePartialSelect} from "@cody-engine/cody/hooks/utils/query/make-query-resolver";
import {PartialSelect} from "@event-engine/infrastructure/DocumentStore";
import {Filter} from "@app/shared/value-object/query/filter-types";

type PartialSelectWithClientAnd = PartialSelect & {on: {and?: Filter}}

describe("makePartialSelect", () => {
  test("simple select", () => {
    const lines: string[] = [];

    makePartialSelect(["propA", "propB"], lines, '    ');

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
        lookup: "my_collection",
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
    ] as PartialSelectWithClientAnd, lines, '    ');

    expect(lines.join("\n")).toEqual(`    [
      'propA',
      'propB',
      {
        lookup: 'my_collection',
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
