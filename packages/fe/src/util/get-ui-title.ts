import {camelCaseToTitle} from "./string";
import {FieldProps} from "@rjsf/utils";

export const getUiTitle = (props: FieldProps): string => {
    if(props.uiSchema && props.uiSchema['ui:title']) {
        return props.uiSchema['ui:title'];
    }

    if(props.schema && props.schema.title) {
        return props.schema.title;
    }

    return camelCaseToTitle(props.name);
}
