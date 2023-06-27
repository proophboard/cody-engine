import {environment} from "@frontend/environments/environment";

const Welcome = (props: {}) => {
  return <>
    <h1>Welcome to {environment.appName}</h1>
  </>
}

export default Welcome;
