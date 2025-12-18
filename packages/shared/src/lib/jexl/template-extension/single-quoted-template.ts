
export function singleQuotedMustacheToConcat(input: string): string {
  const replaceEscapedCurly = (str: string) =>
    str.split("\\{{").join("{{");

  return input.replace(
    /'((?:\\.|[^'\\])*)'/g,
    (match, content) => {
      // Only process strings that contain an unescaped {{
      if (!/(^|[^\\])\{\{/.test(content)) {
        return replaceEscapedCurly(match);
      }

      const parts: string[] = [];
      let lastIndex = 0;

      const exprRegex = /(^|[^\\])\{\{([^}]+)\}\}/g;
      let m: RegExpExecArray | null;

      while ((m = exprRegex.exec(content)) !== null) {
        const exprStart = m.index + m[1].length;

        const literal = content.slice(lastIndex, exprStart);
        if (literal) {
          parts.push(`'${replaceEscapedCurly(literal)}'`);
        }

        parts.push(m[2].trim());
        lastIndex = exprStart + m[0].length - m[1].length;
      }

      const remaining = content.slice(lastIndex);
      // Always append remaining literal (even if empty)
      parts.push(`'${replaceEscapedCurly(remaining)}'`);

      return parts.join('+');
    }
  );
}
