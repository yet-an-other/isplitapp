import Container from "@mui/material/Container/Container";
import { BOTTOM_BAR_HEIGHT } from "./FooterBar";

type Props = { children: React.ReactNode };

const ContentBar: React.FC<Props> = props => {
    return(
        <Container disableGutters maxWidth="md" sx={{ minHeight:`calc(100vh - ${BOTTOM_BAR_HEIGHT})`, display: 'flex', flexDirection: 'column', width: '100%'}}>
            { props.children }
        </Container>
    )
}

export default ContentBar;