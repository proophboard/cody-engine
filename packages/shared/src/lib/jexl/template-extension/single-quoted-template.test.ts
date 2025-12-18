import { singleQuotedMustacheToConcat } from './single-quoted-template';
import jexl from "@app/shared/jexl/get-configured-jexl";

describe('singleQuotedMustacheToConcat', () => {
  it('converts a simple template expression', () => {
    const input = "'Hello {{name}}'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("'Hello '+name+''");
  });

  it('handles multiple interpolations', () => {
    const input = "'{{greeting}}, {{name}}!'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("greeting+', '+name+'!'");
  });

  it('leaves strings without template expressions unchanged', () => {
    const input = "'Just a normal string'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("'Just a normal string'");
  });

  it('treats escaped ${ as literal text', () => {
    const input = "'Price: \\{{amount}}'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("'Price: {{amount}}'");
  });

  it('works inside a larger expression', () => {
    const input = "msg + ': {{value}}. Done'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("msg + ': '+value+'. Done'");
  });

  it('handles mixed escaped and unescaped dollar signs', () => {
    const input = "'\\{{notVar}} and {{realVar}}'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("'{{notVar}} and '+realVar+''");
  });

  it('does not break escaped single quotes', () => {
    const input = "'It\\'s {{value}}'";
    const output = singleQuotedMustacheToConcat(input);

    expect(output).toBe("'It\\'s '+value+''");
  });

  it('works with a simple jexl expression', () => {
    const ctx = {name: 'Jane', age: 30};

    const output = jexl.evalSync(`$> 'Hello {{name}}'`, ctx);
    expect(output).toBe("Hello Jane");
  })

  it('works with a complex jexl expression', () => {
    const ctx = {name: 'Jane', age: 30};

    const output = jexl.evalSync(`$> '{{name}} is {{age}} years old. ' + (age > 30 ? '{{name|upper()}} is above 30' : '{{name|upper()}} is 30 or younger.')`, ctx);
    expect(output).toBe("Jane is 30 years old. JANE is 30 or younger.");
  })

  it('does not interfere with other expression syntax', () => {
    const output = jexl.evalSync(`[{a: {}}]`);

    expect(output).toStrictEqual([{a:{}}])
  })
});
