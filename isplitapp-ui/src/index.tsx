import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Route, Routes, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
import Home from './app/Home';
import HeaderBar from './controls/HeaderBar';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import FooterBar from './controls/FooterBar';
import { PartyList } from './app/PartyList';
import { AlertContextProvider } from './controls/AlertProvider';
import ContentBar from './controls/ContentBar';
import PartyEdit from './app/PartyEdit';
import Party from './app/Party';
import ExpenseList from './app/ExpenseList';
import Balance from './app/Balance';
import ExpenseEdit from './app/ExpenseEdit';
import { GlobalErrorAlert }  from './app/GlobalError';

import * as Sentry from "@sentry/react";
import { captureConsoleIntegration, httpClientIntegration } from "@sentry/integrations";

Sentry.init({
  dsn: "https://8592952298c41c59b935f1f60b154dc8@o4506730525294592.ingest.sentry.io/4506730534600704",
  sendDefaultPii: true,
  release: `iSplitApp@${process.env.REACT_APP_VERSION}`,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),    
    captureConsoleIntegration(),
    httpClientIntegration()
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/isplit\.app/, /^https:\/\/api\.isplit\.app/, /^https:\/\/dev\.isplit\.app/, /^https:\/\/apidev\.isplit\.app/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

let theme = createTheme({
  palette: {
    background: {
      paper: '#f9fcff' //'#f7f8fa'
    },
    primary: {
      main: '#091e6f',
    },
    secondary: {
      main: '#cddc39',
    },    
  },
});

theme = responsiveFontSizes(theme);
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <Sentry.ErrorBoundary fallback={<GlobalErrorAlert />}>
      <BrowserRouter>
        <ContentBar>
          <HeaderBar />
          <AlertContextProvider>
             <SentryRoutes>

                  <Route index element={<Home />} />
                  <Route path="groups/:partyId" element={<Party />} >
                    <Route path="expenses" element={<ExpenseList />} />
                    <Route path="expenses/create" element={<ExpenseEdit />} />
                    <Route path="expenses/:expenseId/edit" element={<ExpenseEdit />} />
                    <Route path="balance" element={<Balance />} />
                    <Route index element={<ExpenseList />} />
                  </Route>
                  <Route path="/groups/create" element={<PartyEdit/>} />
                  <Route path="/groups/:partyId/edit" element={<PartyEdit/>} />
                  <Route path="/groups" element={<PartyList/>} />
                  <Route path="/" element={<Home/>} />

              </SentryRoutes>
          </AlertContextProvider>
        </ContentBar>
        <FooterBar />
        </BrowserRouter>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
