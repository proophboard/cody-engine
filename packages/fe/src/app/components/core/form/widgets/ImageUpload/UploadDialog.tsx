import * as React from 'react';
import {useCallback} from "react";
import {useDropzone} from "react-dropzone";
import {configuredAxios} from "../../core/api/configuredAxios";
import axios from "axios";
import {Dialog, DialogContent, DialogTitle, IconButton, makeStyles} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import {Images} from "../../model/values/Common/Images";

const uploadUrlFromMessageBoxEndpoint = () => {
  const msgBox = process.env.REACT_APP_MESSAGEBOX_URL as string;
  return msgBox.replace('/api/messages', '/files/get-vehicle-image-upload-url');
}

const vehicleUploadUrl = uploadUrlFromMessageBoxEndpoint();

const filename = (file: {path: string}, images: Images) => {
  let numberPart = "01";
  if(images.length > 0) {
    const lastImage = images.map(img => img.src).sort().pop() as string;
    const imageName = lastImage.split("/").pop() as string;
    numberPart = imageName.split(".").shift() as string;
    const nextNumber = parseInt(numberPart) + 1;
    numberPart = nextNumber < 10 ? '0' + nextNumber : '' + nextNumber;
  }

  const ending = file.path.split(".").pop();

  return `${numberPart}.${ending}`;
}

const uploadFile = async (file: any, vehicleId: string, filename: string): Promise<string> => {
  const {data} = await configuredAxios.get(vehicleUploadUrl, {params: {vehicleId, filename}});
  const urlParts: string[] = data.url.split("?");
  const urlWithoutQueryParams = urlParts.shift();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => {
      const binaryStr = reader.result

      axios.put(data.url, binaryStr).then(res => resolve(urlWithoutQueryParams as string)).catch((e) => reject(e));
    }
    reader.readAsArrayBuffer(file)
  })
}

const useStyles = makeStyles((theme: any) => ({
  dialogContent: {
    overflowY: 'hidden',
  },
  dialog: {
    height: 'calc(100% - 64px)',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(0.5),
    color: theme.palette.grey[500],
  },
  dropzone: {
    height: "80%",
    position: "relative",
    backgroundColor: '#efefef',
    backgroundImage: 'linear-gradient(to right, #e7e7e7 50%, transparent 50%), linear-gradient(to right, #e7e7e7 50%, transparent 50%), linear-gradient(to bottom, #e7e7e7 50%, transparent 50%), linear-gradient(to bottom, #e7e7e7 50%, transparent 50%)',
    backgroundPosition: 'left top, left bottom, left top, right top',
    backgroundRepeat: 'repeat-x, repeat-x, repeat-y, repeat-y',
    backgroundSize: '20px 3px, 20px 3px, 3px 20px, 3px 20px',
    display: "flex",
    alignItems: "center",
    justifyContent:"center",
  },
  dropzoneText: {
    color: "#a2a2a2"
  }
}));

interface OwnProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  currentImages: Images
  onImageUploaded: (src: string, suggestedAlt: string) => void
}

type UploadDialogProps = OwnProps;

const UploadDialog = (props: UploadDialogProps) => {
  const classes = useStyles();
  const onDrop = useCallback(acceptedFiles => {
    acceptedFiles.forEach((file: {path: string}) => {
      const suggestedAlt = file.path.split(".").shift() || '';
      uploadFile(file, props.vehicleId, filename(file, props.currentImages)).then(src => props.onImageUploaded(src, suggestedAlt));
    })
  }, [])

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

  const handleCancel = () => {
    props.onClose();
  };

  return (
    <Dialog open={props.open} onClose={handleCancel} fullWidth={true} maxWidth={'lg'}
            PaperProps={{className: classes.dialog}}>
      <DialogTitle>
        Select an Image
        <IconButton className={classes.closeButton} onClick={handleCancel}>
          <CloseIcon/>
        </IconButton>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.dropzone} {...getRootProps()}>
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p className={classes.dropzoneText}>Drop the image here ...</p> :
              <p className={classes.dropzoneText}>Drag 'n' drop an image here, or click to select one</p>
          }
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
