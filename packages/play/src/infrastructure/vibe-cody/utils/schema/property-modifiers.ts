export type PropModifierType = 'input' | 'set' | 'unset' | 'user' | 'userName' | 'userEmail' | 'now' | 'expr';

export interface PropModifier {
  prop: string;
  type: PropModifierType;
}

export interface InputPropModifier extends PropModifier {}

export const isInputPropModifier = (modifier: PropModifier): modifier is InputPropModifier => {
  return modifier.type === "input";
}

export interface SetPropModifier<T> extends PropModifier {
  value: T;
}

export const isSetPropModifier = <T>(modifier: PropModifier): modifier is SetPropModifier<T> => {
  return modifier.type === "set";
}

export interface UnsetPropModifier extends PropModifier {}

export const isUnsetPropModifier = (modifier: PropModifier): modifier is UnsetPropModifier => {
  return modifier.type === "unset";
}

export interface UserPropModifier extends PropModifier {}

export const isUserPropModifier = (modifier: PropModifier): modifier is UserPropModifier => {
  return modifier.type === "user";
}

export interface UserNamePropModifier extends PropModifier {}

export const isUserNamePropModifier = (modifier: PropModifier): modifier is UserNamePropModifier => {
  return modifier.type === "userName";
}

export interface UserEmailPropModifier extends PropModifier {}

export const isUserEmailPropModifier = (modifier: PropModifier): modifier is UserEmailPropModifier => {
  return modifier.type === "userEmail";
}

export interface NowPropModifier extends PropModifier {}

export const isNowPropModifier = (modifier: PropModifier): modifier is NowPropModifier => {
  return modifier.type === "now";
}

export interface ExprPropModifier extends PropModifier {
  expr: string;
}

export const isExprPropModifier = (modifier: PropModifier): modifier is ExprPropModifier => {
  return modifier.type === "expr";
}

export const parsePropModifiers = (text: string): PropModifier[] => {
  const lines = text.split(`\n`);

  return lines.map(l => parsePropModifier(l)).filter(m => typeof m !== "undefined") as PropModifier[];
}

export const parsePropModifier = (line: string): SetPropModifier<unknown> | ExprPropModifier | PropModifier | undefined => {
  let [prop, modifier] = line.split(":").map(p => p.trim());

  if(!prop || !modifier) {
    return;
  }

  prop = prop.replace('- ', '').trim();

  const match = modifier.match(/^(?<modifier>[a-z]+)\((?<value>.*)\)$/);

  if(!match) {
    return;
  }

  const modifierType = match['groups']!['modifier'];
  const value = match['groups']!['value'];

  if(!isValidModifierType(modifierType)) {
    return;
  }

  if(modifierType === "set") {
    return {
      prop,
      type: "set",
      value
    }
  }

  if(modifierType === "expr") {
    return {
      prop,
      type: "expr",
      expr: value,
    }
  }

  return {
    prop,
    type: modifierType
  };
}

const isValidModifierType = (type: PropModifierType | string): type is PropModifierType => {
  switch (type) {
    case "input":
    case "set":
    case "unset":
    case "user":
    case "userName":
    case "userEmail":
    case "now":
    case "expr":
      return true;
    default:
      return false;
  }
}
