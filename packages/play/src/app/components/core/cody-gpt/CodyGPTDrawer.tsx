import * as React from 'react';
import {
  Alert,
  Autocomplete,
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
import {PlayTopLevelPage} from "@cody-play/state/types";
import {names} from "@event-engine/messaging/helpers";
import {useNavigate} from "react-router-dom";
import {UsePageResult, usePlayPageMatch} from "@cody-play/hooks/use-play-page-match";
import {RuntimeEnvironment} from "@frontend/app/providers/UseEnvironment";
import {useEnv} from "@frontend/hooks/use-env";
import {ElementEditedContext, PlayConfigDispatch} from "@cody-play/infrastructure/cody/cody-message-server";
import {CodyResponse} from "@proophboard/cody-types";
import {playIsCodyError} from "@cody-play/infrastructure/cody/error-handling/with-error-check";
import {AddAPageWithName} from "@cody-play/infrastructure/cody-gpt/page-instructions/add-a-page-with-name";
import {
  AddATableWithDefaults
} from "@cody-play/infrastructure/cody-gpt/information-instructions/add-a-table-with-defaults";

interface OwnProps {
  open: boolean;
  onClose: () => void;
}

type CodyGPTDrawerProps = OwnProps;

interface Message {
  text: string;
  author: 'user' | 'cody';
  error?: boolean;
}

export interface Instruction {
  text: string,
  alternatives?: string[],
  subInstructions?: Instruction[],
  match: (input: string) => boolean,
  execute: (input: string, dispatch: PlayConfigDispatch, config: CodyPlayConfig, navigateTo: (route: string) => void) => Promise<CodyResponse>,
}

const defaultInstructions: Instruction[] = [
  AddAPageWithName,
]

const onPageInstructions: Instruction[] = [
  AddATableWithDefaults,
]

const suggestInstructions = (activePage: UsePageResult, config: CodyPlayConfig, env: RuntimeEnvironment): Instruction[] => {
  console.log("active page: ", activePage);
  if(activePage.pathname === "/dashboard") {
    return defaultInstructions;
  }

  return [...defaultInstructions, ...onPageInstructions];
}


const CodyGPTDrawer = (props: CodyGPTDrawerProps) => {
  const env = useEnv();
  const theme = useTheme();
  const {config, dispatch} = useContext(configStore);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction|undefined>(undefined);
  const [value, setValue] = useState<string | Instruction | null>(null);
  const [searchStr, setSearchStr] = useState<string>('');
  const [navigateTo, setNavigateTo] = useState<string|undefined>();
  const pageMatch = usePlayPageMatch();
  const navigate = useNavigate();



  useEffect(() => {
    if(navigateTo) {
      navigate(navigateTo);
      setNavigateTo(undefined);
    }
  }, [navigateTo]);

  const addMessage = (message: Message) => {
    messages.push(message);
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

    const codyResponse = await instruction.execute(userInput, dispatch, config, (route: string) => {
      window.setTimeout(() => {
        setNavigateTo(route);
      }, 30);

    });

    addMessage({
      text: codyResponse.cody + (codyResponse.details ? `\n\n${codyResponse.details}` : ''),
      author: "cody",
      error: playIsCodyError(codyResponse)
    });
  }

  return <Drawer anchor={"right"}
                 open={props.open}
                 onClose={props.onClose}
                 variant="persistent"
                 sx={{
                   width: 540,
                   overscrollBehavior: 'contain',
                   [`& .MuiDrawer-paper`]: { width:  540, boxSizing: 'border-box', overflowX: "hidden" },
                 }}
  >
    <DialogTitle>
      <Grid2 container>
        <Grid2 xs sx={{padding: theme.spacing(2)}}>
          CodyGPT
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
    <DialogContent sx={{padding: '24px 24px'}}>
      <Alert severity="info">Start typing to tell Cody what you want to build. Use the suggestions to provide precise instructions. It works best when using one instruction at a time. Cody will immediately apply them. When saving your work as a Playshot, your prooph board will be updated with the changes as well.</Alert>
      <Divider sx={{marginTop: theme.spacing(2), marginBottom: theme.spacing(2)}} />
      {messages.map((m, index) => <Alert key={`cody_gpt_msg_${index}`}
                                         sx={{marginBottom: theme.spacing(2),
                                           marginRight: m.author === "user" ? theme.spacing(4) : undefined,
                                           marginLeft: m.author === 'cody' ? theme.spacing(4) : undefined}}
                                         icon={m.author === 'cody' ? <AccountCowboyHat /> : <AccountVoice />}
                                         severity={m.author === 'user' ? 'warning' : m.error ? 'error' : 'success'}><pre style={{whiteSpace: "pre-wrap"}}>{m.text}</pre></Alert>)}
      <Autocomplete<Instruction, false, false, true> renderInput={(params) => <TextField {...params}
                                                        helperText={<span>Start typing to get suggestions.</span>}
                                                        variant="outlined"
                                                        placeholder={'Next instruction'}
                                                         />}
                                 options={suggestInstructions(pageMatch, config, env)}
                                 freeSolo={true}
                                 value={value}
                                 autoComplete={true}
                                 inputValue={searchStr}
                                 onChange={(e,v) => handleInstruction(v)}
                                 onInputChange={(e,v) => setSearchStr(v)}
                                 getOptionLabel={o => typeof o === "string" ? o : o.text}
      />

    </DialogContent>
  </Drawer>
};

export default CodyGPTDrawer;
