import * as React from 'react';
import {useContext, useEffect, useState} from "react";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  FormLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField, useMediaQuery, useTheme
} from "@mui/material";
import {StickyNote2} from "@mui/icons-material";
import Editor from "@monaco-editor/react";
import {
  getMessageContext, isCommandContext, isEventContext, isQueryContext,
  MessageContext
} from "@cody-play/app/components/core/play-backend/Messagebox/message-context";
import {useUser} from "@frontend/hooks/use-user";
import {Send} from "mdi-material-ui";
import {cloneDeepJSON} from "@frontend/util/clone-deep-json";
import {getConfiguredPlayMessageBox} from "@cody-play/infrastructure/message-box/configured-message-box";
import Grid2 from "@mui/material/Grid";
import {Event} from "@event-engine/messaging/event";
import {useQueryClient} from "@tanstack/react-query";
import {Palette} from "@cody-play/infrastructure/utils/styles";
import {DockMode, isDrawerMode} from "@cody-play/app/layout/AppSettingsModal";
import {JexlFlavouredJSON} from "@event-engine/infrastructure/code-editor/JexlFlavouredJSON";

interface MessageOption {
  name: string;
  type: "command" | "event" | "query";
}

interface OwnProps {
  saveCallback: (cb: () => void) => void;
  onSaveDisabled: (disabled: boolean) => void;
  dockMode: DockMode;
}

type MessageboxProps = OwnProps;

const Messagebox = (props: MessageboxProps) => {
  const theme = useTheme();
  const {config} = useContext(configStore);
  const [messageOptions, setMessageOptions] = useState<MessageOption[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageOption|null>(null);
  const [searchStr, setSearchStr] = useState<string>('');
  const [messageContext, setMessageContext] = useState<MessageContext | undefined>();
  const [messageContextStr, setMessageContextStr] = useState<string>('');
  const [result, setResult] = useState<object | undefined>();
  const [invalidMessageContext, setInvalidMessageContext] = useState(false);
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs');
  const [user,] = useUser();
  const queryClient = useQueryClient();
  const sideBarPersistent = useMediaQuery(theme.breakpoints.up('lg'), {
    defaultMatches: true,
  });

  const resetContext = () => {
    setMessageContext(undefined);
    setMessageContextStr('');
    setResult(undefined);
  }

  const deriveMessageContextFromSelectedOption = () => {
    if(selectedMessage) {
      const ctx = getMessageContext(selectedMessage.name, selectedMessage.type, config, user);
      setMessageContext(ctx);
      setMessageContextStr(JSON.stringify(ctx, null ,2));
    } else {
      resetContext();
    }
  }

  useEffect(() => {
    setMessageOptions(getMessageOptions(config));
  }, [config]);

  useEffect(() => {
    deriveMessageContextFromSelectedOption();
  }, [selectedMessage]);

  useEffect(() => {
    window.setTimeout(() => {
      setEditorTheme(theme.palette.mode === 'dark' ? 'vs-dark' : 'vs');
    },10);
  }, [theme.palette.mode]);

  const handleMessageContextChanged = (editorVal: string | undefined) => {
    if(!editorVal) {
      deriveMessageContextFromSelectedOption();
      if(invalidMessageContext) {
        setInvalidMessageContext(false);
      }
      return;
    }

    if(invalidMessageContext) {
      try {
        JSON.parse(editorVal);
        setInvalidMessageContext(false);
      } catch (e) {
        // ignore
      }
    }

    setMessageContextStr(editorVal);
  }

  const handleSendMessage = () => {
    try {
      const msgCtx: MessageContext = JSON.parse(messageContextStr);

      setResult(undefined);

      (async () => {
        if(msgCtx.type !== "query") {
          await queryClient.invalidateQueries();
        }

        setResult(await sendMessage(msgCtx, config));
      })().catch(e => {
        console.error(e);
        setResult({
          error: e instanceof Error ? e.message : e
        })
      });
    } catch (e) {
      console.error(e);
      setInvalidMessageContext(true);
    }
  }

  return <div style={{marginLeft: "10px", marginRight: "10px"}}>
    <Grid2 container={true} spacing={4} sx={{paddingTop: 0}}>
      <Grid2 size={{xs: 12, md: isDrawerMode(props.dockMode, !sideBarPersistent) ? 12 : 6}}>
        <Autocomplete<MessageOption>
          disablePortal={true}
          id="message"
          renderInput={(params) => <TextField {...params}
                                              helperText={<span>Select a message. You can also change dependencies and rules to test your logic.</span>}
                                              variant="standard"
                                              label="MESSAGE" />}
          value={selectedMessage}
          inputValue={searchStr}
          onChange={(e,v) => setSelectedMessage(v)}
          onInputChange={(e,v) => setSearchStr(v)}
          options={messageOptions}
          getOptionLabel={o => o.name}
          isOptionEqualToValue={(o, v) => o.name === v.name}
          renderOption={(props, option: MessageOption) => {
              return <MenuItem {...props} key={option.name}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                  <StickyNote2 sx={{color: getMessageColor(option)}}/>
                  <ListItemText style={{marginLeft: '10px'}}>{option.name}</ListItemText>
                </div>
              </MenuItem>
            }
          }
        />
      </Grid2>
    </Grid2>
    <Grid2 container={true} spacing={4}>
      <Grid2 size={{xs: 12, md: isDrawerMode(props.dockMode, !sideBarPersistent) ? 12 : 6}}>
        <FormLabel>Message Context</FormLabel>
        {invalidMessageContext &&
          <Alert variant="standard" severity="error">Invalid Message Context. Please check your input!</Alert>}
        <div style={{border: '1px solid #eee'}}>
          <Editor height="400px"
                  language="json"
                  value={messageContextStr}
                  onChange={handleMessageContextChanged}
                  onMount={(editor, monaco) => {
                    monaco.editor.setTheme(editorTheme);
                    monaco.languages.setMonarchTokensProvider('json', JexlFlavouredJSON as any);
                  }}
                  options={{
                    theme: editorTheme,
                    tabSize: 2,
                    folding: true,
                    glyphMargin: false,
                    lineDecorationsWidth: 1,
                    minimap: {
                      enabled: false
                    },
                    formatOnPaste: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    mouseWheelZoom: true,
                    fixedOverflowWidgets: true,
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    },
                    readOnly: !messageContext,
                    lineNumbers: "off"
                  }}
          />
        </div>
        <Box sx={{display: 'flex'}}>
          <Button
            children={'Send Message'}
            startIcon={<Send/>}
            onClick={() => handleSendMessage()}
          />
        </Box>
      </Grid2>
      <Grid2 size={{xs: 12, md: isDrawerMode(props.dockMode, !sideBarPersistent) ? 12 : 6}}>
        <FormLabel>Result</FormLabel>
        <div style={{border: '1px solid #eee'}}>
          <Editor height="400px"
                  language="json"
                  value={JSON.stringify(result, null, 2)}
                  onMount={(editor, monaco) => monaco.editor.setTheme(editorTheme)}
                  options={{
                    theme: editorTheme,
                    tabSize: 2,
                    folding: true,
                    glyphMargin: false,
                    lineDecorationsWidth: 1,
                    minimap: {
                      enabled: false
                    },
                    formatOnPaste: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    scrollbar: {
                      alwaysConsumeMouseWheel: false
                    },
                    mouseWheelZoom: true,
                    fixedOverflowWidgets: true,
                    readOnly: true,
                    lineNumbers: "off"
                  }}
          />
        </div>
      </Grid2>
    </Grid2>
  </div>
};

export default Messagebox;

const getMessageOptions = (config: CodyPlayConfig): MessageOption[] => {
  const messageOptions: MessageOption[] = [];

  Object.keys(config.queries).forEach(name => messageOptions.push({name, type: "query"}));
  Object.keys(config.commands).forEach(name => messageOptions.push({name, type: "command"}));
  Object.keys(config.events).forEach(name => messageOptions.push({name, type: "event"}));

  return messageOptions;
}

const getMessageColor = (msgOption: MessageOption): string => {
  switch (msgOption.type) {
    case "command":
      return Palette.stickyColors.command;
    case "event":
      return Palette.stickyColors.event;
    case "query":
    default:
      return Palette.stickyColors.document;
  }
}

const getMessageOption = (messageName: string, messageOptions: MessageOption[]): MessageOption => {
  for (const messageOption of messageOptions) {
    if(messageOption.name === messageName) {
      return messageOption;
    }
  }

  return {
    name: "Unknown",
    type: "query"
  }
}

const sendMessage = async (ctx: MessageContext, config: CodyPlayConfig): Promise<object> => {
  const configCopy = cloneDeepJSON(config);
  if(isQueryContext(ctx)) {
    configCopy.queries[ctx.messageName].desc.dependencies = ctx.dependencies;
    configCopy.resolvers[ctx.messageName] = ctx.resolve;

    return getConfiguredPlayMessageBox(configCopy, true).queryBus.dispatch(
      {
        name: ctx.messageName,
        uuid: ctx.messageId,
        payload: ctx.query,
        meta: ctx.meta,
        createdAt: new Date(ctx.createdAt)
      },
      configCopy.queries[ctx.messageName].desc
    );
  }

  if(isCommandContext(ctx)) {
    configCopy.commands[ctx.messageName].desc.dependencies = ctx.dependencies;
    configCopy.commandHandlers[ctx.messageName] = ctx.rules;

    return getConfiguredPlayMessageBox(configCopy, true).commandBus.dispatch(
      {
        name: ctx.messageName,
        uuid: ctx.messageId,
        payload: ctx.command,
        meta: ctx.meta,
        createdAt: new Date(ctx.createdAt)
      },
      configCopy.commands[ctx.messageName].desc
    ).then(success => ({success}));
  }

  if(isEventContext(ctx)) {
    const eventPolicies = {...ctx.projections, ...ctx.policies};

    configCopy.eventPolicies[ctx.messageName] = eventPolicies;

    const eventBus = getConfiguredPlayMessageBox(configCopy, true).eventBus;
    const event: Event = {
      name: ctx.messageName,
      uuid: ctx.messageId,
      payload: ctx.event,
      meta: ctx.meta,
      createdAt: new Date(ctx.createdAt)
    }

    const success = await eventBus.on(event, false);

    if(success) {
      return eventBus.on(event, true).then(success => ({success}));
    } else {
      return {error: "At least one policy failed to handle the event. Check browser console for details!"}
    }
  }

  throw Error(`Failed to send message: ${JSON.stringify(ctx)}. Type is not supported`);
}
