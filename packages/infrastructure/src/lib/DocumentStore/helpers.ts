import {SortOrder} from "@event-engine/infrastructure/DocumentStore";

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
