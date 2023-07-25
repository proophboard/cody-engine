import React, {ChangeEvent, useState} from 'react';
import { FieldProps } from '@rjsf/utils';
import UploadDialog from "./ImageUpload/UploadDialog";
import {UiSchema} from "@rjsf/utils";
import {getUiTitle} from "@frontend/util/get-ui-title";
import {makeStyles} from "@mui/material";
import {Image} from "@app/shared/types/core/image/image";

const useStyles = makeStyles(theme => ({
  container: {
    marginBottom: '20px',
  },
  placeholderImg: {
    width: '100%',
    marginBottom: '20px',
    cursor: 'pointer',
  },
  placeholderImgReadonly: {
    width: '100%',
    marginBottom: '20px',
    color: theme.palette.grey[500]
  },
  placeholderErr: {
    width: '100%',
    marginBottom: '20px',
    color: theme.palette.error.main,
    cursor: 'pointer',
  },
  previewImg: {
    width: '100px',
    cursor: 'pointer',
    backgroundImage: 'linear-gradient(\n' +
      '45deg, #c0c0c0 25%, transparent 25%), linear-gradient( \n' +
      '-45deg, #c0c0c0 25%, transparent 25%), linear-gradient(\n' +
      '45deg, transparent 75%, #c0c0c0 75%), linear-gradient( \n' +
      '-45deg, transparent 75%, #c0c0c0 75%);',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
  },
  previewImgReadonly: {
    width: '100px',
    backgroundImage: 'linear-gradient(\n' +
      '45deg, #c0c0c0 25%, transparent 25%), linear-gradient( \n' +
      '-45deg, #c0c0c0 25%, transparent 25%), linear-gradient(\n' +
      '45deg, transparent 75%, #c0c0c0 75%), linear-gradient( \n' +
      '-45deg, transparent 75%, #c0c0c0 75%);',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'center',
  },
  titleItem: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  newVersion: {
    backgroundColor: theme.palette.warning.light,
  },
}))

interface OwnProps {
}



type VehicleImageUploadProps = OwnProps & FieldProps<Image>;

const renderTitleAsHeading = (uiSchema: UiSchema): boolean  => {
  if(!uiSchema['ui:options']) {
    return false;
  }

  if(!uiSchema['ui:options']['headingTitle']) {
    return false;
  }


  return !!uiSchema['ui:options']['headingTitle'];
}

const renderTitle = (uiSchema: UiSchema): boolean  => {
  if(!uiSchema['ui:options']) {
    return false;
  }

  if(!uiSchema['ui:options']['showTitle']) {
    return false;
  }


  return !!uiSchema['ui:options']['showTitle'];
}

type FormContext = {image: Image};

const updateFormContext = (ctx: FormContext, oldSrc: string | undefined, image: Image) => {
  if(!oldSrc && !ctx.images.find(img => img.src === image.src)) {
    ctx.images.push(image);
  }

  const oldImage = ctx.images.find(img => img.src === oldSrc);

  if(oldImage) {
    oldImage.src = image.src;
    oldImage.alt = image.alt;
  } else if (!ctx.images.find(img => img.src === image.src)) {
    ctx.images.push(image);
  }
}

const VehicleImageUpload = (props: VehicleImageUploadProps) => {
  const classes = useStyles();
  const {vehicleId, images} = props.formContext as FormContext;
  const [selectImageDialogOpen, setSelectImageDialogOpen] = useState<boolean>(false);
  const [oldSrc, setOldSrc] = useState<string>();

  // @ts-ignore
  const image = {src: "", alt: "", ...props.formData};

  if(typeof oldSrc === 'undefined') {
    setOldSrc(image.src);
  }

  const openMediaAssetDialog = () => {
    if(props.readonly) {
      return;
    }
    setSelectImageDialogOpen(true);
  };

  const updateAlt = (alt: string) => {
    props.onChange({...image, alt: alt === ''? null : alt});
  }

  const handleAltChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const val = e.currentTarget.value;
    updateAlt(val);
  }

  const updateSrc = (src: string) => {
    props.onChange({...image, src: src === ''? null : src});
  }

  const handleImageUploaded = (src: string, suggestedAlt: string) => {
    image.src = src;
    updateSrc(src);

    if(!image.alt) {
      image.alt = suggestedAlt;
      updateAlt(suggestedAlt);
    }

    updateFormContext(props.formContext, oldSrc, {...image, src});
    setSelectImageDialogOpen(false);
  }

  const isAltError = props.errorSchema.hasOwnProperty('alt');

  const title = getUiTitle(props);
  const showTitle = renderTitle(props.uiSchema as UiSchema);
  const headingTitle = renderTitleAsHeading(props.uiSchema as UiSchema);

  const onSetSelectImageDialogOpen = () => setSelectImageDialogOpen(false);

  return <>
        <Grid container={true} spacing={2} className={classes.container}>
        {title && <Grid item={true} xs={12} className={classes.titleItem}>
          {showTitle && headingTitle && <Heading {...props} />}
          {showTitle && !headingTitle && <InputLabel required={props.required}>{ title }</InputLabel> }
        </Grid>}
        <Grid item={true} xs={12}  md={12} lg={4} className={classes.previewItem}>
          {!image.src && <Panorama className={isAltError? classes.placeholderErr : props.readonly? classes.placeholderImgReadonly : classes.placeholderImg} fontSize="large" onClick={openMediaAssetDialog} />}
          {image.src
            && <img src={`${image.src}`} alt="preview image" className={props.readonly? classes.previewImgReadonly : classes.previewImg} onClick={openMediaAssetDialog} />
          }
        </Grid>
        <Grid item={true} xs={12} md={6} lg={4}>
          <TextField name="src" label="Name" value={ image.src } disabled={true} required={true} fullWidth={true} />
        </Grid>
        <Grid item={true} xs={12} md={6} lg={4}>
          <TextField name="alt" label="Alt" value={ image.alt } error={isAltError} required={true} onChange={handleAltChange} fullWidth={true} disabled={props.disabled || props.readonly} />
        </Grid>
      </Grid>
      <UploadDialog open={selectImageDialogOpen} onClose={onSetSelectImageDialogOpen} vehicleId={vehicleId} currentImages={images} onImageUploaded={handleImageUploaded} />
    </>
};

export default VehicleImageUpload;
