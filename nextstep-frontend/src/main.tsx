import ReactDOM from 'react-dom/client';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import GithubConnection from './components/GithubConnection';

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <>
    <CssBaseline />
    {/* <App /> */}
    <GithubConnection />
  </>
);
