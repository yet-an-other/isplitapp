import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import Home from './app/Home';
import Topbar from './controls/Topbar';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import Bottombar from './controls/Bottombar';


let theme = createTheme({
  palette: {
    primary: {
      main: '#091e6f',
    },
    secondary: {
      main: '#cddc39',
    },    
  },
});

theme = responsiveFontSizes(theme);
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Topbar />
        <Home />
        <Bottombar />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
