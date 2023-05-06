import {camelCase, startCase, snakeCase, kebabCase} from 'lodash';

export const names = (str: string): {name: string, className: string, propertyName: string, constantName: string, fileName: string} => {
  return {
    name: str,
    className: startCase(camelCase(str)).replace(/ /g, ''),
    propertyName: camelCase(str),
    constantName: snakeCase(str).toUpperCase(),
    fileName: kebabCase(str),
  }
}
