import Expression, {Context} from "jexl/Expression";

type TransformFunction = (value: any, ...args: any[]) => any;

type BinaryOpFunction = (left: any, right: any) => any;

type UnaryOpFunction = (right: any) => any;

type FunctionFunction = (value: any, ...args: any[]) => any;

export interface Jexl {
  addBinaryOp(operator: string, precedence: number, fn: BinaryOpFunction): void;

  /**
   * Adds a unary operator to Jexl. Unary operators are currently only supported
   * on the left side of the value on which it will operate.
   * @param operator The operator string to be added
   * @param fn A function to run to calculate the result. The function
   *      will be called with one argument: the literal value to the right of the
   *      operator. It should return either the resulting value, or a Promise
   *      that resolves with the resulting value.
   */
  addUnaryOp(operator: string, fn: UnaryOpFunction): void;

  /**
   * Adds or replaces a transform function in this Jexl instance.
   * @param name The name of the transform function, as it will be used
   *      within Jexl expressions
   * @param fn The function to be executed when this transform is
   *      invoked. It will be provided with at least one argument:
   *          - {*} value: The value to be transformed
   *          - {...*} args: The arguments for this transform
   */
  addTransform(name: string, fn: TransformFunction): void;

  /**
   * Syntactic sugar for calling {@link #addTransform} repeatedly.  This function
   * accepts a map of one or more transform names to their transform function.
   * @param map A map of transform names to transform functions
   */
  addTransforms(map: { [key: string]: TransformFunction }): void;

  /**
   * Retrieves a previously set transform function.
   * @param name The name of the transform function
   * @returns The transform function
   */
  getTransform(name: string): TransformFunction;

  /**
   * Adds or replaces an expression function in this Jexl instance.
   * @param name The name of the expression function, as it will be
   *      used within Jexl expressions.
   * @param fn The javascript function to be executed when this
   *      expression function is invoked. It will be provided with each argument
   *      supplied in the expression, in the same order.
   */
  addFunction(name: string, fn: FunctionFunction): void;

  /**
   * Syntactic sugar for calling {@link #addFunction} repeatedly. This function
   * accepts a map of one or more expression function names to their javascript
   * function counterpart.
   * @param map A map of expression function names to javascript functions.
   */
  addFunctions(map: { [key: string]: FunctionFunction }): void;

  /**
   * Retrieves a previously set expression function.
   * @param name The name of the expression function
   * @returns The expression function
   */
  getFunction(name: string): FunctionFunction;

  /**
   * Asynchronously evaluates a Jexl string within an optional context.
   * @param expression The Jexl expression to be evaluated
   * @param context A mapping of variables to values, which will be
   *      made accessible to the Jexl expression when evaluating it
   * @returns resolves with the result of the evaluation.
   */
  eval(expression: string, context?: Context): Promise<any>;

  /**
   * Synchronously evaluates a Jexl string within an optional context.
   * @param expression The Jexl expression to be evaluated
   * @param context A mapping of variables to values, which will be
   *      made accessible to the Jexl expression when evaluating it
   * @returns the result of the evaluation.
   * @throws on error
   */
  evalSync(expression: string, context?: Context): any;

  /**
   * Creates an Expression object from the given Jexl expression string, and
   * immediately compiles it. The returned Expression object can then be
   * evaluated multiple times with new contexts, without generating any
   * additional string processing overhead.
   * @param expression The Jexl expression to be compiled
   * @returns The compiled Expression object
   */
  compile(expression: string): Expression;

  /**
   * Constructs an Expression object from a Jexl expression string.
   * @param expression The Jexl expression to be wrapped in an
   *    Expression object
   * @returns The Expression object representing the given string
   */
  createExpression(expression: string): Expression;

  /**
   * Removes a binary or unary operator from the Jexl grammar.
   * @param operator The operator string to be removed
   */
  removeOp(operator: string): void;
}
