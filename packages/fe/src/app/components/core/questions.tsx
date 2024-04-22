import {environment} from "@frontend/environments/environment";
import {Flash} from "mdi-material-ui";
import PrototypeMode from "@frontend/app/components/core/prototype/PrototypeMode";
import {Link} from "@mui/material";

const Questions = (props: {}) => {
  return <>
    <h1>Welcome to {environment.appName}</h1>
    <p><Flash sx={{color: '#f5e339'}} />QUESTIONS: <Link href="http://localhost:4250">Cody Engine</Link><Flash sx={{color: '#f5e339'}} /></p>
    
    {}
  </>
}

export default Questions;
