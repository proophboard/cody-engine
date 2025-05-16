import * as React from 'react';
import {
  Alert,
  Autocomplete, Box,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  TextField,
  useTheme
} from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import TopRightActions from "@frontend/app/components/core/actions/TopRightActions";
import {AccountCowboyHat, AccountVoice, Close} from "mdi-material-ui";
import {useContext, useEffect, useState} from "react";
import {CodyPlayConfig, configStore, getEditedContextFromConfig} from "@cody-play/state/config-store";
import {useNavigate} from "react-router-dom";
import {UsePageResult, usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {useEnv} from "@frontend/hooks/use-env";
import {PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyResponse} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {VibeCodyContext} from "@cody-play/infrastructure/vibe-cody/VibeCodyContext";
import {instructions} from "@cody-play/infrastructure/vibe-cody/instructions";
import {RuntimeEnvironment} from "@frontend/app/providers/runtime-environment";
import CodyEmoji from "@cody-play/app/components/core/vibe-cody/CodyEmoji";

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

export interface Instruction {
  text: string,
  alternatives?: string[],
  subInstructions?: Instruction[],
  isActive: (context: VibeCodyContext, config: CodyPlayConfig, env: RuntimeEnvironment) => boolean,
  match: (input: string) => boolean,
  execute: (input: string, ctx: VibeCodyContext, dispatch: PlayConfigDispatch, config: CodyPlayConfig, navigateTo: (route: string) => void) => Promise<CodyResponse>,
}

const suggestInstructions = (activePage: UsePageResult, config: CodyPlayConfig, env: RuntimeEnvironment): Instruction[] => {
  const ctx: VibeCodyContext = {page: activePage};

  return instructions.filter(i => i.isActive(ctx, config, env))
}

// Persist messages across the lifetime of the session
let globalMessages: Message[] = [];

let pendingNavigateTo: string | undefined;

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

  // Ensure that latest page is available for instructions
  const configPage = config.pages[pageMatch.handle.page.name];
  const syncedPageMatch = configPage ? {...pageMatch, handle: {page: configPage}} : pageMatch;

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

  const handleInstruction = (input: Instruction | string | null) => {
    setValue(input);

    if(input && typeof input === "object") {
      setSelectedInstruction(input);
      return;
    }

    if(typeof input === "string") {
      addMessage({
        text: input,
        author: "user"
      })

      if(!selectedInstruction) {
        const possibleInstructions = suggestInstructions(syncedPageMatch, config, env).filter(i => i.match(input));

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
      {
        page: syncedPageMatch,
      },
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
      <Alert severity="info">Start typing to tell Cody what you want to build. It works best when using one instruction at a time. Cody will immediately apply them. A saved Playshot will also update the connected prooph board.</Alert>
      <Divider sx={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}} />
      {messages.map((m, index) => <Alert key={`cody_gpt_msg_${index}`}
                                         sx={{marginBottom: theme.spacing(2),
                                           marginRight: m.author === "user" ? theme.spacing(4) : undefined,
                                           marginLeft: m.author === 'cody' ? theme.spacing(4) : undefined}}
                                         icon={m.author === 'cody' ? <CodyEmoji style={{width: '30px', height: '30px'}} /> : <AccountVoice />}
                                         severity={m.author === 'user' ? 'warning' : m.error ? 'error' : 'success'}><pre style={{whiteSpace: "pre-wrap"}}>{m.text}</pre></Alert>)}
      <Box sx={{paddingBottom: theme.spacing(12), position: "sticky", bottom: 0, backgroundColor: theme.palette.background.paper}}>
        {messages.length > 0 && <Divider sx={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}}/>}
        <Autocomplete<Instruction, false, false, true> renderInput={(params) => <TextField {...params}
                                                          helperText={<span>Start typing to get suggestions.</span>}
                                                          variant="outlined"
                                                          placeholder={'Next instruction'}
                                                           />}
                                   options={suggestInstructions(syncedPageMatch, config, env)}
                                   freeSolo={true}
                                   value={value}
                                   autoComplete={false}
                                   inputValue={searchStr}
                                   onChange={(e,v) => {
                                     e.stopPropagation();
                                     handleInstruction(v);
                                   }}
                                   onInputChange={(e,v) => setSearchStr(v)}
                                   getOptionLabel={o => typeof o === "string" ? o : o.text}
        />
      </Box>
    </DialogContent>
  </Drawer>
};

export default VibeCodyDrawer;
