import { AppBar, Toolbar, Typography, styled, Button, IconButton, SvgIcon } from '@mui/material';
import Container from '@mui/material/Container';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as SvgLogogo } from '../logo1.svg'

const GroupsButton = styled(Button)({
    fontWeight: "bold",
    position: 'absolute', 
    left: '50%', 
    top: '50%',
    transform: 'translate(-50%, -50%)',
    color: "white"
});


const LogoText = styled(Typography)(({theme}) => ({
    fontFamily: "fantasy",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    [theme.breakpoints.up("xs")]: {
        display: 'none'
      },    
    [theme.breakpoints.up("sm")]: {
        display: 'flex'
      },
    alignSelf: 'end',
    paddingBottom: theme.spacing(1)
}));

function HeaderBar() {

    const navigate = useNavigate();
    return (
        <>
            <AppBar position='fixed' >
                <Container maxWidth="xl" sx={{pl:0}}>
                    <Toolbar disableGutters>
                        <IconButton onClick={() =>navigate("/")} sx={{ mr: .5 }}>
                            <SvgIcon sx={{color: 'secondary.main', height: '32px', width: '32px'}}>
                                <SvgLogogo />
                            </SvgIcon>
                        </IconButton>
                        <LogoText variant='subtitle2' >
                            iSplitApp
                        </LogoText>
                        <GroupsButton  onClick={() => navigate('groups', {state: Math.random()}) }>
                            Groups
                        </GroupsButton>
                    </Toolbar>
                </Container>
            </AppBar>
            <Toolbar />
        </>
    )
}

export default HeaderBar;