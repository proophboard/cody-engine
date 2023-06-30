import React from 'react';
import {AxiosResponse} from 'axios';
import Editor from '@monaco-editor/react';
import {Box, Container, useTheme} from "@mui/material";

interface AxiosResponseViewerProps {
    response: AxiosResponse;
    successMessageCreated?: string | React.ReactNode;
}

const AxiosResponseViewer = (props: AxiosResponseViewerProps) => {

    const theme = useTheme();

    // @ts-ignore
    const requestTime = props.response.config.metadata.requestTime;

    return (
        <Container disableGutters={true}>
            {(!props.successMessageCreated || props.response.status !== 201) && <Container sx={{
                backgroundColor: theme.palette.background.default,
                padding: '10px',
            }}>
                <Box component={'span'} sx={{
                    paddingLeft: '10px',
                    paddingRight: '10px',
                }}>
                    Status: {props.response.status} {props.response.statusText}
                </Box>
                <Box component={'span'} sx={{
                    paddingLeft: '10px',
                    paddingRight: '10px',
                }}>
                    Time: {requestTime} ms
                </Box>
            </Container>}
            <>
            {(props.successMessageCreated && (props.response.status === 201 || props.response.status === 200)) && <>{props.successMessageCreated}</>}
            {(props.response.status >= 400) && <Editor
                value={JSON.stringify(props.response.data, null, 2)}
                height={'450px'}
                language={'json'}
                theme={theme.palette.mode === 'light' ? 'light' : 'dark'}
                options={{
                    readOnly: true,
                    minimap: {
                        enabled: false,
                    },
                    scrollBeyondLastLine: false,
                }}
            />}
            </>
        </Container>
    );
};

export default AxiosResponseViewer;
