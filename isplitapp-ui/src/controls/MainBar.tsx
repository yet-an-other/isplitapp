import Container from "@mui/material/Container/Container";
import { BOTTOM_BAR_HEIGHT } from "./BottomBar";

type Props = { children: React.ReactNode };

const MainBar: React.FC<Props> = props => {

    return(
        <Container disableGutters sx={{ minHeight:`calc(100vh - ${BOTTOM_BAR_HEIGHT})`, display: 'flex', flexDirection: 'column', width: '100%'}}>
            { props.children }
        </Container>
    )
}

export default MainBar;