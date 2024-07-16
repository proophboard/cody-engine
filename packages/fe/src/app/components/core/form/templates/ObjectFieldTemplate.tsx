import {
  FormContextType,
  ObjectFieldTemplateProps,
  RJSFSchema,
  StrictRJSFSchema,
  canExpand,
  descriptionId,
  getTemplate,
  getUiOptions,
  titleId, ObjectFieldTemplatePropertyType, UiSchema,
} from '@rjsf/utils';
import Grid2, {Grid2Props} from "@mui/material/Unstable_Grid2";
import {CSSObject} from "@mui/material";

export const getElementGridConfig = (element: ObjectFieldTemplatePropertyType, uiSchema: UiSchema): object & {xs: number, style: CSSObject} => {
  const elUiSchema = uiSchema[element.name] || {};
  const elUiOptions = elUiSchema['ui:options'] || {};
  const gridOptions: object & {xs: number, style: CSSObject} = elUiOptions.grid || {};

  if(!gridOptions.xs) {
    gridOptions.xs = 12;
  }

  if(!gridOptions.style) {
    gridOptions.style = {marginBottom: '10px'};
  } else {
    gridOptions.style = {marginBottom: '10px', ...gridOptions.style};
  }

  return gridOptions;
}

export const getContainerGridConfig = (uiOptions: object & {container?: object}): object & {style: CSSObject, spacing: number} => {
  const gridConfig: object & {style?: CSSObject, spacing?: number} = uiOptions.container || {style: {}, spacing: 2};

  if(!gridConfig.style) {
    gridConfig.style = { marginTop: '10px' };
  } else {
    gridConfig.style = { marginTop: '10px', ...gridConfig.style };
  }

  if(!gridConfig.spacing) {
    gridConfig.spacing = 2;
  }

  return gridConfig as object & {style: CSSObject, spacing: number};
}

/** The `ObjectFieldTemplate` is the template to use to render all the inner properties of an object along with the
 * title and description if available. If the object is expandable, then an `AddButton` is also rendered after all
 * the properties.
 *
 * @param props - The `ObjectFieldTemplateProps` for this component
 */
export default function ObjectFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: ObjectFieldTemplateProps<T, S, F>) {
  const {
    description,
    title,
    properties,
    required,
    disabled,
    readonly,
    uiSchema,
    idSchema,
    schema,
    formData,
    onAddClick,
    registry,
  } = props;
  const uiOptions = getUiOptions<T, S, F>(uiSchema);
  const TitleFieldTemplate = getTemplate<'TitleFieldTemplate', T, S, F>('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    uiOptions
  );

  const gridConfig = getContainerGridConfig(uiOptions);


  // Button templates are not overridden in the uiSchema
  const {
    ButtonTemplates: { AddButton },
  } = registry.templates;
  return (
    <>
      {title && (
        <TitleFieldTemplate
          id={titleId<T>(idSchema)}
          title={title}
          required={required}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      {description && (
        <DescriptionFieldTemplate
          id={descriptionId<T>(idSchema)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      )}
      <Grid2 container={true} {...gridConfig as Grid2Props}>
        {properties.map((element, index) =>
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <Grid2 key={index} {...getElementGridConfig(element, (uiSchema || {}) as UiSchema) as Grid2Props}>
              {element.content}
            </Grid2>
          )
        )}
        {canExpand<T, S, F>(schema, uiSchema, formData) && (
          <Grid2 container justifyContent='flex-end'>
            <Grid2>
              <AddButton
                className='object-property-expand'
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
                uiSchema={uiSchema}
                registry={registry}
              />
            </Grid2>
          </Grid2>
        )}
      </Grid2>
    </>
  );
}
