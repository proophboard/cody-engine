
import * as React from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useTheme} from "@mui/material";
import {Close, ZipDisk} from "mdi-material-ui";
import Form from "@rjsf/mui";
import {JSONSchema7} from "json-schema";
import Grid2 from "@mui/material/Unstable_Grid2";
import {getRjsfValidator} from "@frontend/util/rjsf-validator";
import {useContext, useEffect, useRef, useState} from "react";
import {Persona} from "@app/shared/extensions/personas";
import {configStore} from "@cody-play/state/config-store";
import {v4} from "uuid";
import {IChangeEvent} from "@rjsf/core";
import {clearAvatarColorCache} from "@frontend/app/components/core/UserAvatar";
import {saveConfigToLocalStorage} from "@cody-play/infrastructure/multi-model-store/save-config-to-local-storage";
import {currentBoardId} from "@cody-play/infrastructure/utils/current-board-id";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type PlayPersonaModalProps = OwnProps;

const emptyPersona: Partial<Persona> = {
  roles: [],
  email: '',
  displayName: '',
  description: '',
  attributes: {},
}

const PersonaSchema = {
  type: "array",
  items: {
    title: "Persona",
    type: "object",
    additionalProperties: false,
    required: ["displayName", "email", "description", "roles"],
    properties: {
      userId: {type: "string", format: "uuid"},
      displayName: {type: "string", minLength: 1, title: "Name"},
      email: {type: "string", format: "email", title: "Email"},
      color: {type: "string", default: "#dddddd", title: "Avatar Color"},
      description: {type: "string", title: "Description"},
      roles: {
        type: "array",
        title: "Roles",
        items: {type: "string", default: "Anyone", title: 'Role'},
        minItems: 1
      },
      attributes: {
        type: "object",
        title: "Attributes",
        additionalProperties: true
      }
    }
  }
} as JSONSchema7;

const PersonaUiSchema = {
  items: {
    userId: {"ui:widget": "hidden"},
    description: {"ui:widget": "textarea"},
    color: {"ui:widget": "color"}
  }
}

const PlayPersonaModal = (props: PlayPersonaModalProps) => {
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  let formRef: any = useRef();
  const [formData, setFormData] = useState<Persona[]>([emptyPersona as Persona]);
  const [liveValidate, setLiveValidate] = useState(false);

  useEffect(() => {
    const personas = config.personas.slice(1);
    setFormData(personas.length === 0 ? [emptyPersona as Persona] : personas);
  }, [config.personas])

  const handleValidationError = () => {
    setLiveValidate(true);
  }

  const handleChange = () => {
    setFormData(formRef.state?.formData || [emptyPersona as Persona]);
  }

  const handleSave = () => {
    formRef.submit();
  }

  const handleFormSubmit = (e: IChangeEvent<any>) => {
    const changedPersonas = e.formData.map((p: Persona) => {
      if(!p.userId) {
        return {
          ...p,
          userId: v4()
        }
      }

      clearAvatarColorCache(p.userId);
      return {...p};
    });

    changedPersonas.unshift(config.personas[0]);

    dispatch({
      type: "SET_PERSONAS",
      personas: changedPersonas
    })

    const boardId = currentBoardId();
    if(boardId) {
      saveConfigToLocalStorage({...config, personas: changedPersonas}, boardId);
    }

    props.onClose();
  }



  return <Dialog open={props.open} onClose={props.onClose} fullWidth={true} maxWidth={'lg'} sx={{"& .MuiDialog-paper": {minHeight: "50%"}}}>
    <DialogTitle>
      Manage Personas
      <IconButton sx={{
        position: 'absolute',
        right: theme.spacing(1),
        top: theme.spacing(0.5),
        color: theme.palette.grey[500],
      }} onClick={props.onClose}>
        <Close />
      </IconButton>
    </DialogTitle>
    <DialogContent sx={{ padding: '24px 24px' }}>
      <Grid2 container={true} spacing={3}>
        <Grid2 md={12}>
          <Form schema={PersonaSchema}
                ref={(form) => formRef = form}
                validator={getRjsfValidator()}
                formData={formData}
                noHtml5Validate={true}
                onError={handleValidationError}
                onSubmit={handleFormSubmit}
                uiSchema={PersonaUiSchema}
                children={<></>}
                liveValidate={liveValidate}
                onChange={handleChange}
                />
        </Grid2>
      </Grid2>
    </DialogContent>
    <DialogActions>
      <Button
        children={'Close'}
        onClick={props.onClose}
        color={'secondary'}
      />
      <Button
        variant={'contained'}
        color={'primary'}
        startIcon={ <ZipDisk />}
        sx={{ textTransform: 'none', margin: '5px' }}
        onClick={handleSave}
      >
        {'Save'}
      </Button>
    </DialogActions>
  </Dialog>
};

export default PlayPersonaModal;
