import { Alert, Box } from '@mui/material';
import * as React from 'react';
import { useRouteError } from 'react-router-dom';

interface OwnProps {
  codyEngine?: boolean;
}

type ErrorBoundaryProps = OwnProps;

const ErrorBoundary = (props: ErrorBoundaryProps) => {
  const error = useRouteError();

  if(error instanceof Error && error.message === 'Rendered more hooks than during the previous render.') {
    window.location.reload();
  }

  if(error instanceof Error && error.message.indexOf('Minified React error #310') === 0) {
    window.location.reload();
  }

  return <>
    {error instanceof Error
      ? <Alert severity="error">{error.name + ': ' + error.message}</Alert>
      : <Alert severity="error">{'Something went wrong!' + (error && error.toString())}</Alert>}
    <Box sx={{height: '50px'}} />
    {!props.codyEngine && <Alert severity="info">Try to reload the app first. In case the error remains check your prooph board configuration. You can load an older Playshot or start a blank session from the prooph board Cody Play menu (prooph board &#8594; Top Menu &#8594; Cody Play).</Alert>}
    {props.codyEngine && <Alert severity="info">Try to reload the app first. In case the error remains please contact the support team.</Alert>}
  </>

};

export default ErrorBoundary;
