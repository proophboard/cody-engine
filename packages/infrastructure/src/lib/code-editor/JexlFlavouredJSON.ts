export const JexlFlavouredJSON = {
  tokenPostfix: '.json',

  // Jexl functions & transforms
  keywords: [
    // general functions
    'count', 'merge', 'deepMerge', 'uuid', 'isRole', 'userAttr', 'pageData', 'mediaQuery',
    // general transforms
    'data', 'role', 'attr', 'typeof', 'default', 'call',
    // string extension
    'upperCase', 'upper', 'lowerCase', 'lower', 'split', 'trim', 'trimEnd', 'trimStart', 'pad', 'padStart', 'padEnd',
    // type cast extension
    'toInt', 'toFloat', 'toStr', 'toJSON', 'fromJSON', 'toArray',
    // Math extension
    'round', 'ceil', 'floor',
    // Array extension
    'push', 'contains', 'filter', 'map', 'join', 'first', 'last', 'orderBy', 'list',
    // Obj extension
    'get', 'set', 'unset', 'keys', 'values', 'pick', 'omit',
    // Sequence extension
    'nextval',
    // Datetime Extension
    'now', 'date', 'utc', 'isoDate', 'isoTime', 'isoDateTime', 'localDate', 'localTime', 'localDateTime',
    'year', 'utcYear', 'month', 'utcMonth', 'day', 'utcDay', 'weekDay', 'utcWeekDay', 'hours', 'utcHours',
    'minutes', 'utcMinutes', 'seconds', 'utcSeconds', 'milliseconds', 'utcMilliseconds', 'timezoneOffset',
    'timestamp', 'addMilliseconds', 'subMilliseconds', 'addSeconds', 'subSeconds', 'addMinutes', 'subMinutes',
    'addHours', 'subHours', 'addDays', 'subDays', 'addWeeks', 'subWeeks', 'twoDigit',
  ],

  jsonKeywords: [
    'true', 'false', 'null'
  ],

  typeKeywords: [
    'any', 'boolean', 'number', 'object', 'string', 'undefined',
  ],

  operators: [
    '<=', '>=', '==', '!=', '=>', '+', '-', '**',
    '*', '/', '%', '++', '--', '<<', '</', '>>', '>>>', '&',
    '|', '^', '!', '~', '&&', '||', '?', ':', '=', '+=', '-=',
    '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=',
    '^=', '@',
  ],

  // we include these common regular expressions
  symbols: /[=><!~?:&|+\-*\/\^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  digits: /\d+(_+\d+)*/,
  octaldigits: /[0-7]+(_+[0-7]+)*/,
  binarydigits: /[0-1]+(_+[0-1]+)*/,
  hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

  regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
  regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

  tokenizer: {
    root: [
      [/\{/, 'delimiter.bracket', '@json_obj'],
      [/\[/, 'delimiter.bracket', '@json_array'],
      [/"/, 'string', '@string_double'],
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/0[xX](@hexdigits)/, 'number.hex'],
      [/0[oO]?(@octaldigits)/, 'number.octal'],
      [/0[bB](@binarydigits)/, 'number.binary'],
      [/(@digits)/, 'number'],
      [/true/, 'keyword'],
      [/false/, 'keyword'],
      [/null/, 'keyword'],
      { include: '@whitespace' },
    ],

    json_obj: [
      [/"/, 'string', '@string_double'],
      [/:/, 'delimiter', '@json_val'],
      { include: '@whitespace' },
      [/}/, 'delimiter.bracket', '@pop'],
    ],

    json_array: [
      [/\{/, 'delimiter.bracket', '@json_obj'],
      [/\[]/, 'delimiter.bracket', '@json_array'],
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/0[xX](@hexdigits)/, 'number.hex'],
      [/0[oO]?(@octaldigits)/, 'number.octal'],
      [/0[bB](@binarydigits)/, 'number.binary'],
      [/(@digits)/, 'number'],
      [/[a-z_$][\w$]*/, {
        cases: {
          '@jsonKeywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/"\$>/, { token: "source.js", next: "@jexl" }],
      [/"/, 'keyword', '@json_val_string'],
      { include: 'whitespace' },
      [/]/, 'delimiter.bracket', '@pop'],
    ],

    json_val: [
      [/\{/, 'delimiter.bracket', '@json_obj'],
      [/\[/, 'delimiter.bracket', '@json_array'],
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/0[xX](@hexdigits)/, 'number.hex'],
      [/0[oO]?(@octaldigits)/, 'number.octal'],
      [/0[bB](@binarydigits)/, 'number.binary'],
      [/(@digits)/, 'number'],
      [/[a-z_$][\w$]*/, {
        cases: {
          '@jsonKeywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/"\$>/, { token: "source.js", next: "@jexl" }],
      [/"/, 'keyword', '@json_val_string'],
      { include: 'whitespace' },
      [/,/, "delimiter", "@pop"],
      [/\n/, '', '@pop']
    ],

    json_val_string: [
      [/[^\\"]+/, 'keyword'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'keyword', '@pop']
    ],

    common: [
      // identifiers and keywords
      [/[a-z_$][\w$]*/, {
        cases: {
          '@typeKeywords': 'keyword',
          '@keywords': 'keyword',
          '@jsonKeywords': 'keyword',
          '@default': 'identifier'
        }
      }],
      [/[A-Z][\w\$]*/, 'type.identifier'],  // to show class names nicely
      // [/[A-Z][\w\$]*/, 'identifier'],

      // whitespace
      { include: '@whitespace' },

      // regular expression: ensure it is terminated before beginning (otherwise it is an opeator)
      /*[/\/(?=([^\\\/]|\\.)+\/([gimsuy]*)(\s*)(\.|;|\/|,|\)|\]|\}|$))/, { token: 'regexp', bracket: '@open', next: '@regexp' }],*/

      // delimiters and operators
      [/[()\[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'delimiter',
          '@default': ''
        }
      }],

      // numbers
      [/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
      [/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
      [/0[xX](@hexdigits)/, 'number.hex'],
      [/0[oO]?(@octaldigits)/, 'number.octal'],
      [/0[bB](@binarydigits)/, 'number.binary'],
      [/(@digits)/, 'number'],

      // delimiter: after number because of .\d floats
      [/[;,.]/, 'delimiter'],

      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
      [/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
      [/"/, 'string', '@string_double'],
      [/'/, 'string', '@string_single'],
      [/`/, 'string', '@string_backtick'],
    ],

    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],

    comment: [
      [/[^\/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[\/*]/, 'comment']
    ],

    jexl: [
      [/\\".*\\"/, 'string'],
      [/"/, "jexl", "@pop"],
      { include: 'common' }
    ],

    jsdoc: [
      [/[^\/*]+/, 'comment.doc'],
      [/\*\//, 'comment.doc', '@pop'],
      [/[\/*]/, 'comment.doc']
    ],

    // We match regular expression quite precisely
    /*regexp: [
      [/(\{)(\d+(?:,\d*)?)(\})/, ['regexp.escape.control', 'regexp.escape.control', 'regexp.escape.control']],
      [/(\[)(\^?)(?=(?:[^\]\\\/]|\\.)+)/, ['regexp.escape.control', { token: 'regexp.escape.control', next: '@regexrange' }]],
      [/(\()(\?:|\?=|\?!)/, ['regexp.escape.control', 'regexp.escape.control']],
      [/[()]/, 'regexp.escape.control'],
      [/@regexpctl/, 'regexp.escape.control'],
      [/[^\\\/]/, 'regexp'],
      [/@regexpesc/, 'regexp.escape'],
      [/\\\./, 'regexp.invalid'],
      [/(\/)([gimsuy]*)/, [{ token: 'regexp', bracket: '@close', next: '@pop' }, 'keyword.other']],
    ],

    regexrange: [
      [/-/, 'regexp.escape.control'],
      [/\^/, 'regexp.invalid'],
      [/@regexpesc/, 'regexp.escape'],
      [/[^\]]/, 'regexp'],
      [/\]/, { token: 'regexp.escape.control', next: '@pop', bracket: '@close' }],
    ],*/

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop']
    ],

    string_val_double: [
      [/[^\\"]+/, 'identifier'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'identifier', '@pop']
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, 'string', '@pop']
    ],

    string_backtick: [
      [/\$\{/, { token: 'delimiter.bracket', next: '@bracketCounting' }],
      [/[^\\`$]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/`/, 'string', '@pop']
    ],

    bracketCounting: [
      [/\{/, 'delimiter.bracket', '@bracketCounting'],
      [/\}/, 'delimiter.bracket', '@pop'],
      { include: 'common' }
    ],
  }
};
