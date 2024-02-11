import { AddCircle, ArrowRight } from "@mui/icons-material";
import { Box, Button, Container, Paper, Stack, Typography, styled } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HighLightTypography = styled(Typography) (({theme}) => ({
    paddingTop: "6px",
    color: theme.palette.primary.main,
    fontWeight: "bold"
}))

const FeatureItem = styled(Box)(({theme})=>({
    display: "flex",
    color: theme.palette.text.disabled,
}))



function Home(){

    const navigate = useNavigate();

    return(

        <Container disableGutters sx={{ mx: 'auto', textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontWeight: 'bold',  mt: 16, mb: 1 }}>
                Share <Typography variant="h2" component="span" sx={{ fontWeight: 'bold', color: 'primary.main'}}>Expenses</Typography>
            </Typography>
            <Typography variant="h6" sx={{mb: 10, color:'text.disabled'}}>
                Intuitive, Clean and Free. Ads Free.
            </Typography>

            <Stack direction="column"sx={{mx:'auto', mt:10, mb: 15, maxWidth: '230px'}}>
                <Button variant="contained" startIcon={<AddCircle/>} size="large" onClick={() => navigate('groups/create')} title="Create Group">
                    Create Group
                </Button>
                <Button variant="contained" startIcon={<AddCircle/>}  size="large" sx={{display: 'none'}}>
                    Create Expense
                </Button>
            </Stack>

            <Paper elevation={0} sx={{ px: 2, py: 4, my: 10 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', my: 4 }}>
                    Features
                </Typography>
            
            
                <Typography variant="subtitle1" maxWidth="md" sx={{mx:'auto', textAlign:'left'}} >
                    <Stack spacing={3} >
                        <ShowFeature 
                            title="Get right to it" 
                            subtitle="Simply input expenses and participants, and you're good to go! No need for registration, app downloads, or SMS hassle. Plus, no pesky ads to divert your focus from what matters most." />
                        <ShowFeature 
                            title="Completely open source and free" 
                            subtitle="Access all our source code on GitHub. With a public API, you can customize your own user interface or export expenses as needed." />
                        <ShowFeature 
                            title="Easy sharing" 
                            subtitle="Share your group and expenses effortlessly by sending the app's link. And for added clarity, visualize balances on a chart to see each participant's spending at a glance" /> 
                    </Stack>
                </Typography>
            </Paper>
        </Container>
    )
}


const ShowFeature =(props: { title: string, subtitle: string }) => {
    return(
        <Stack direction="row">
            <ArrowRight fontSize="large" color="primary"/>
            <Stack>
                <HighLightTypography>{props.title}</HighLightTypography>
                <FeatureItem>{props.subtitle}</FeatureItem>
            </Stack>
        </Stack> 
    )
}

export default Home;