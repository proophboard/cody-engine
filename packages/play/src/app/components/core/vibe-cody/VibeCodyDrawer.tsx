import * as React from 'react';
import {useContext, useEffect, useRef, useState} from 'react';
import {
  Alert, AlertTitle,
  Autocomplete,
  Box,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton, ListItem, ListItemIcon, ListItemText,
  TextField,
  useTheme
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {AccountVoice, Close, Target} from "mdi-material-ui";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {useNavigate} from "react-router-dom";
import {UsePageResult, usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {useEnv} from "@frontend/hooks/use-env";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyResponse, CodyResponseType, ReplyCallback} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {instructions} from "@cody-play/infrastructure/vibe-cody/instructions";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";
import CodyEmoji from "@cody-play/app/components/core/vibe-cody/CodyEmoji";
import {useVibeCodyFocusElement} from "@cody-play/hooks/use-vibe-cody";
import {startCase} from "lodash";
import {DragAndDropContext} from "@cody-play/app/providers/DragAndDrop";

export const VIBE_CODY_DRAWER_WIDTH = 540;

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type VibeCodyDrawerProps = OwnProps;

interface Message {
  text: string;
  author: 'user' | 'cody';
  error?: boolean;
}

export type InstructionExecutionCallback = (input: string, ctx: VibeCodyContext, dispatch: PlayConfigDispatch, config: CodyPlayConfig, navigateTo: (route: string) => void) => Promise<CodyInstructionResponse>;

export interface Instruction {
  text: string,
  icon?: React.ReactNode,
  noInputNeeded?: boolean,
  isActive: (context: VibeCodyContext, config: CodyPlayConfig, env: RuntimeEnvironment) => boolean,
  match: (input: string) => boolean,
  execute: InstructionExecutionCallback,
}

export interface InstructionProvider {
  isActive: (context: VibeCodyContext, config: CodyPlayConfig, env: RuntimeEnvironment) => boolean,
  provide: (context: VibeCodyContext, config: CodyPlayConfig, env: RuntimeEnvironment) => Instruction[],
}

const isInstructionProvider = (i: Instruction | InstructionProvider): i is InstructionProvider => {
  return typeof (i as any).provide === "function";
}

export type CodyInstructionResponse = CodyResponse & {instructionReply?: InstructionExecutionCallback};

const suggestInstructions = (ctx: VibeCodyContext, config: CodyPlayConfig, env: RuntimeEnvironment): Instruction[] => {
  const suggestions: Instruction[] = [];

  instructions.filter(i => i.isActive(ctx, config, env))
    .forEach(i => {
      if(isInstructionProvider(i)) {
        suggestions.push(...i.provide(ctx, config, env));
      } else {
        suggestions.push(i);
      }
    })

  return suggestions;
}

// Persist messages across the lifetime of the session
let globalMessages: Message[] = [];

let pendingNavigateTo: string | undefined;

let lockChange = false;

let waitingReply: InstructionExecutionCallback | undefined;

const VibeCodyDrawer = (props: VibeCodyDrawerProps) => {
  const env = useEnv();
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  const [messages, setMessages] = useState<Message[]>([...globalMessages]);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction|undefined>(undefined);
  const [value, setValue] = useState<string | Instruction | null>(null);
  const [searchStr, setSearchStr] = useState<string>('');
  const [navigateTo, setNavigateTo] = useState<string|undefined>(pendingNavigateTo);
  const pageMatch = usePlayPageMatch();
  const navigate = useNavigate();
  const [focusedElement, setFocusedElement] = useVibeCodyFocusElement();
  const { dndEvent } = useContext(DragAndDropContext);
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    if(dndEvent) {
      // Force the user to focus an element again, to avoid that focused element
      // is moved so that e.g. containerInfo is no longer valid
      // @TODO: maybe find a softer way to handle the issue
      setFocusedElement(undefined);
    }
  }, [dndEvent]);

  useEffect(() => {
    setFocusedElement(undefined);
  }, [pageMatch.handle.page.name]);

  useEffect(() => {
    if(focusedElement && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusedElement?.id]);

  useEffect(() => {
    if(inputRef.current && props.open) {
      inputRef.current.focus();
    }
  }, [inputRef.current, props.open]);

  // Ensure that latest page is available for instructions
  const configPage = config.pages[pageMatch.handle.page.name];
  const syncedPageMatch = configPage ? {...pageMatch, handle: {page: configPage}} : pageMatch;

  const vibeCodyCtx: VibeCodyContext = {
    page: syncedPageMatch,
    focusedElement,
    setFocusedElement,
  }

  useEffect(() => {
    if(navigateTo) {
      navigate(navigateTo);
      setNavigateTo(undefined);
    }
  }, [navigateTo]);

  const addMessage = (message: Message) => {
    messages.push(message);
    globalMessages.push(message);
    setMessages([...messages]);
  }

  const handleInstruction = async (input: Instruction | string | null) => {
    setValue(input);

    if(input && typeof input === "object") {
      setSelectedInstruction(input);
      waitingReply = undefined;

      if(input.noInputNeeded) {
        addMessage({
          text: input.text,
          author: "user"
        })

        await executeInstruction(input, '');
        reset();
      }

      return;
    }

    if(typeof input === "string") {
      addMessage({
        text: input,
        author: "user"
      })

      if(waitingReply) {
        const codyResponse = await waitingReply(
          input,
          vibeCodyCtx,
          dispatch,
          config,
          (route: string) => {
            pendingNavigateTo = route;
            window.setTimeout(() => {
              pendingNavigateTo = undefined;
              setNavigateTo(route);
            }, 30);
          });

        addMessage({
          text: codyResponse.cody + (codyResponse.details ? `\n\n${codyResponse.details}` : ''),
          author: "cody",
          error: playIsCodyError(codyResponse)
        });

        waitingReply = codyResponse.instructionReply;
        reset();
        return;
      }

      if(!selectedInstruction) {
        const possibleInstructions = suggestInstructions(vibeCodyCtx, config, env).filter(i => i.match(input));

        if(possibleInstructions.length) {
          setSelectedInstruction(possibleInstructions[0]);
          executeInstruction(possibleInstructions[0], input).then(() => reset()).catch((e: any) => console.error(e));
          return;
        }

        addMessage({
          text: "Sorry, I did not understand your instruction. Please try again by selecting a suggestion and complete it with your idea.",
          author: "cody",
          error: true
        })
      } else {
        executeInstruction(selectedInstruction, input).then(() => reset()).catch((e: any) => console.error(e));
      }
    } else {
      reset();
    }
  }

  const reset = () => {
    setSelectedInstruction(undefined);
    setSearchStr('');
    setValue(null);
  }

  const executeInstruction = async (instruction: Instruction, userInput: string) => {
    console.log(instruction, userInput);

    const codyResponse = await instruction.execute(
      userInput,
      vibeCodyCtx,
      dispatch,
      config,
      (route: string) => {
        pendingNavigateTo = route;
        window.setTimeout(() => {
          pendingNavigateTo = undefined;
          setNavigateTo(route);
        }, 30);

    });

    addMessage({
      text: codyResponse.cody + (codyResponse.details ? `\n\n${codyResponse.details}` : ''),
      author: "cody",
      error: playIsCodyError(codyResponse)
    });

    if(codyResponse.type === CodyResponseType.Question) {
      waitingReply = codyResponse.instructionReply;
    }
  }

  useEffect(() => {
    const dialogContent = document.getElementById('cody-gpt-dialog-content');
    if(dialogContent) {
      dialogContent.scrollTo(0, dialogContent.scrollHeight);
    }
  }, [messages]);

  return <Drawer anchor={"right"}
                 open={props.open}
                 onClose={props.onClose}
                 variant="persistent"
                 sx={{
                   width: VIBE_CODY_DRAWER_WIDTH,
                   overscrollBehavior: 'contain',
                   [`& .MuiDrawer-paper`]: { width:  540, boxSizing: 'border-box', overflowX: "hidden" },
                 }}
  >
    <DialogTitle>
      <Grid2 container>
        <Grid2 xs sx={{padding: theme.spacing(2)}}>
          Vibe Cody
        </Grid2>
        <TopRightActions  uiOptions={{}} defaultService={config.defaultService} jexlCtx={{} as any} additionalRightButtons={[
          <IconButton key={'app_settings_close_btn'} sx={{
            color: theme.palette.grey[500],
          }} onClick={props.onClose}>
            <Close />
          </IconButton>
        ]} />
      </Grid2>
    </DialogTitle>
    <DialogContent id="cody-gpt-dialog-content" sx={{padding: '24px 24px', paddingBottom: 0}}>
      <Alert severity="info">Tell Cody what you want to build using one instruction at a time.</Alert>
      <Divider sx={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}} />
      {messages.map((m, index) => <Alert key={`cody_gpt_msg_${index}`}
                                         sx={{marginBottom: theme.spacing(2),
                                           marginRight: m.author === "user" ? theme.spacing(4) : undefined,
                                           marginLeft: m.author === 'cody' ? theme.spacing(4) : undefined}}
                                         icon={m.author === 'cody' ? <CodyEmoji style={{width: '30px', height: '30px'}} /> : <AccountVoice />}
                                         severity={m.author === 'user' ? 'warning' : m.error ? 'error' : 'success'}><pre style={{whiteSpace: "pre-wrap"}}>{m.text}</pre></Alert>)}
      <Box sx={{paddingBottom: theme.spacing(12), position: "sticky", bottom: 0, backgroundColor: theme.palette.background.paper}}>
        {messages.length > 0 && <Divider sx={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}}/>}
        {focusedElement && <Alert severity={"info"}
                                  icon={<Target/>}
                                  sx={{marginBottom: theme.spacing(2)}}
                                  onClose={e => setFocusedElement(undefined)}>
          <AlertTitle>{startCase(focusedElement.type)} {focusedElement.name} is focused</AlertTitle>
          Changes made by Cody will only affect the focused element, and prompt suggestions are filtered accordingly.
        </Alert>}
        <Autocomplete<Instruction, false, false, true> renderInput={(params) => <TextField {...params}
                                                          helperText={<span>Start typing to get suggestions. Use Shift+Enter for multiline.</span>}
                                                          inputRef={inputRef}
                                                          variant="outlined"
                                                          multiline={true}
                                                          placeholder={'Next instruction'}
                                                          onKeyDown={e => {
                                                            if(e.shiftKey && e.key === "Enter") {
                                                              lockChange = true;
                                                            }

                                                            if(e.key === "Escape") {
                                                              setFocusedElement(undefined);
                                                              reset();
                                                            }
                                                          }}
                                                          onKeyUp={() => {
                                                            lockChange = false;
                                                          }}
                                                         />}
                                   options={suggestInstructions(vibeCodyCtx, config, env)}
                                   renderOption={(props, option) => {
                                     return (
                                       <ListItem {...props}>
                                         {option.icon && <ListItemIcon>{option.icon}</ListItemIcon>}
                                         <ListItemText>{option.text}</ListItemText>
                                       </ListItem>
                                     );
                                   }}
                                   filterOptions={(options, state) => {
                                     if (state.inputValue.length >= 1) {
                                       return options.filter((item) =>
                                         String(item.text).toLowerCase().includes(state.inputValue.toLowerCase())
                                       );
                                     }
                                     return [];
                                   }}
                                   freeSolo={true}
                                   value={value}
                                   autoComplete={false}
                                   autoHighlight={true}
                                   inputValue={searchStr}
                                   onChange={(e,v) => {
                                     e.stopPropagation();

                                     if(!lockChange) {
                                       handleInstruction(v).catch(e => console.error(e));
                                     }
                                   }}
                                   onInputChange={(e,v) => {
                                     if(v === `\n`) {
                                       v = '';
                                     }
                                     setSearchStr(v)
                                   }}
                                   getOptionLabel={o => typeof o === "string" ? o : o.text}
        />
      </Box>
    </DialogContent>
  </Drawer>
};

export default VibeCodyDrawer;
