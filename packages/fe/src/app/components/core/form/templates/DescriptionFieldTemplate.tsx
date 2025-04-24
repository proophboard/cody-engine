import Typography from '@mui/material/Typography';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {SxProps, useTheme} from "@mui/material";
import {FormModeType} from "@frontend/app/components/core/CommandForm";
import {getNestingLevel, isDialogMode} from "@frontend/app/components/core/form/templates/ObjectFieldTemplate";

/** The `DescriptionField` is the template to use to render the description of a field
 *
 * @param props - The `DescriptionFieldProps` for this component
 */
export default function DescriptionFieldTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, schema, registry } = props;
  const theme = useTheme();

  const mode: FormModeType = registry.formContext!.mode || 'page';
  const nestingLevel = getNestingLevel(id);
  const objectLike = schema.properties || schema.items;

  const sx: SxProps = objectLike
    ? isDialogMode(mode) && id === "root__description"
      ? {}
      : {
        marginBottom: theme.spacing(2),
        marginTop:  `-${theme.spacing(1)}`,
      }
    : {marginTop: theme.spacing(0.5)};

  if (description) {
    return (
      <Typography id={id} variant="body2" sx={sx} className={"CodyFormDescription" + (objectLike? " CodyObjectFormDescription" : "")}>
        {description}
      </Typography>
    );
  }

  return null;
}
