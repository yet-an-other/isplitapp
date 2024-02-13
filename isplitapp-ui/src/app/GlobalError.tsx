import { Alert, AlertTitle, Container } from "@mui/material";
import { Component, ErrorInfo, ReactNode } from "react";


interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class GlobalError extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <GlobalErrorAlert />
      )
    }

    return this.props.children;
  }
}

export const GlobalErrorAlert = () => 
    <Container>
        <Alert severity="error">
            <AlertTitle>Generic Error</AlertTitle>
            Ooops, something went wrong.
            Unknown error has occured, please, try again later.
        </Alert>
    </Container>


export default GlobalError;