import {
    AliasFieldNameMapping,
    FieldName,
    isLookup,
    Lookup,
    SortOrder
} from "@event-engine/infrastructure/DocumentStore";
import {
    PARTIAL_SELECT_DOC_ID,
    PARTIAL_SELECT_MERGE
} from "@event-engine/infrastructure/DocumentStore/Postgres/PostgresQueryBuilder";

export function getValueFromPath <V = any>(path: string, doc: object, defaultValue?: V): V | undefined {
    const pathKeys = path.split('.');

    let docCopyOrValue: {[prop: string]: any} | V = doc;

    for(const key of pathKeys) {
        if(typeof docCopyOrValue !== 'object') {
            return undefined;
        }

        if(!hasOwnProperty(docCopyOrValue as {[prop: string]: any}, key)) {
            return undefined;
        }


        docCopyOrValue = getOwnProperty(docCopyOrValue as {[prop: string]: any}, key);
    }

    return docCopyOrValue as V;
}

const hasOwnProperty = (doc: {[prop: string]: any}, prop: string): boolean => {
    return doc.hasOwnProperty(prop);
}

const getOwnProperty = (doc: {[prop: string]: any}, prop: string): any => {
    return doc[prop];
}

export const areValuesEqualForAllSorts = (sorting: SortOrder, a: object, b: object): boolean => {
    for (const sortItem of sorting) {
        const aVal = getValueFromPath(sortItem.prop, a, null);
        const bVal = getValueFromPath(sortItem.prop, b, null);

        if(aVal !== bVal) {
            return false;
        }
    }

    return true;
}

export const transformPartialDoc = (partialSelect: Array<FieldName|AliasFieldNameMapping|Lookup>, doc: any): any => {
    let finalDoc: Record<string, any> = {};

    for (const item of partialSelect) {
        const isStringItem = typeof item === 'string';

        if(isLookup(item)) {
            if(item.select && item.select.length) {
                finalDoc = {...finalDoc, ...transformPartialDoc(item.select, doc)};
            }

            continue;
        }

        const field = isStringItem ? item : item.field;
        const alias = isStringItem ? item.replace(/\?$/, '') :  item.alias;

        const isOptional = field.search(/\?$/) !== -1;

        if (alias === '$merge') {
            if (!doc[PARTIAL_SELECT_DOC_ID]) {
                continue;
            }

            finalDoc = {...finalDoc, ...doc[PARTIAL_SELECT_MERGE]};
            continue;
        }

        const value = doc[alias] || null;

        if(isOptional && value === null) {
            continue;
        }

        if (alias.includes('.')) {
            let tmpDocRef = finalDoc;
            const aliasItems = alias.split('.');

            aliasItems.slice(0, -1).forEach(aliasItem => {
                if (!(aliasItem in tmpDocRef)) {
                    tmpDocRef[aliasItem] = {};
                    tmpDocRef = tmpDocRef[aliasItem];
                }
            });

            tmpDocRef[aliasItems.slice(-1)[0]] = value;
            continue;
        }

        finalDoc[alias] = value;
    }

    return finalDoc;
}
