export const camelCaseToTitle = (str: string): string => {
    str = str.replace(/([A-Z](?=[A-Z][a-z])|[^A-Z](?=[A-Z])|[a-zA-Z](?=[^a-zA-Z]))/g, '$1 ');
    return str.charAt(0).toUpperCase() + str.slice(1);
}

const matchTemplateString = (str: string) => {
    return str.match(/^{{(?<value>.+)}}$/);
}

export const isTemplateString = (str: string): boolean => {
    return !!matchTemplateString(str);
}

export const extractTemplateValue = (str: string): string | null => {
    const match = matchTemplateString(str);

    if(!match) {
        return null;
    }

    return match.groups!.value;
}

export const lcWord = (word: string): string => {
    if(word.length === 0) {
        return word;
    }

    return word.charAt(0).toLowerCase()+word.slice(1);
}

export const ucWord = (word: string): string => {
    if(word.length === 0) {
        return word;
    }

    return word.charAt(0).toUpperCase()+word.slice(1);
}
