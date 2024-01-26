import { AppBar, Toolbar, Typography, styled, Button, IconButton } from '@mui/material';
import Container from '@mui/material/Container';
import LogoPng  from '../Logo.png';
import { useNavigate } from 'react-router-dom';

const GroupsButton = styled(Button)({
    fontWeight: "bold",
    position: 'absolute', 
    left: '50%', 
    top: '50%',
    transform: 'translate(-50%, -50%)',
    color: "white"
});

const LogoImage = styled('img') (({theme})=>({
    height: "32px",
    width: "32px",
}))

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

function Topbar() {

    const navigate = useNavigate();
    return (
        <>
            <AppBar position='fixed' >
                <Container maxWidth="xl" sx={{pl:0}}>
                    <Toolbar disableGutters>
                        <IconButton onClick={() =>navigate("/")} sx={{ mr: .5 }}>
                            <LogoImage src={LogoPng} alt='Logo' />
                        </IconButton>
                        <LogoText variant='subtitle2' >
                            iSplitApp
                        </LogoText>
                        <GroupsButton  onClick={() => navigate('groups')}>
                            Groups
                        </GroupsButton>
                    </Toolbar>
                </Container>
            </AppBar>
            <Toolbar />
        </>
    )
}

export default Topbar;