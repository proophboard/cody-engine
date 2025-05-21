import {camelCase, startCase, snakeCase, kebabCase} from 'lodash';

export type Names = {name: string, className: string, propertyName: string, constantName: string, fileName: string};

export const names = (str: string): Names  => {
  return {
    name: str,
    className: startCase(camelCase(str)).replace(/ /g, ''),
    propertyName: camelCase(str),
    constantName: snakeCase(str).toUpperCase(),
    fileName: kebabCase(str),
  }
}
