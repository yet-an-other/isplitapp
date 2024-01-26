import { AddCircle, ArrowRight } from "@mui/icons-material";
import { Box, Button, Container, Stack, Typography, styled } from "@mui/material";
import { useNavigate } from "react-router-dom";


const MainContainer = styled(Container)({
    marginLeft: "auto",
    marginRight:"auto",
    textAlign: "center"
});

const ButtonStack = styled(Stack)({
    marginTop: "50px",
    marginLeft: "auto",
    marginRight:"auto",
    marginBottom: "50px",
    maxWidth: "230px"
})

const FeatureTypography = styled(Typography)(({theme})=>({
    marginTop: "40px",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left",
    [theme.breakpoints.up("sm")]: {
        paddingLeft: "40px"
    }
}))

const HighLightTypography = styled(Typography) (({theme}) =>({
    color: theme.palette.primary.main,
    fontWeight: "bold"
}))

const FeatureItem = styled(Box)(({theme})=>({
    display: "flex",
    color: theme.palette.action.active,
}))

const Subtitle = styled(Typography)(({theme}) =>({
    marginBottom: theme.spacing(10),
    color: theme.palette.action.active
}))


function Home(){

    const navigate = useNavigate();

    return(

        <MainContainer maxWidth="lg">
            <Typography variant="h2" sx={{ fontWeight: 'bold',  mt: 4, mb: 3}}>
                Share Expenses
            </Typography>
            <Subtitle variant="h5">
                Intuitive, Clean and Free. Ads Free.
            </Subtitle>

            <ButtonStack direction="column" spacing={7}>
                <Button variant="contained" startIcon={<AddCircle/>} size="large" onClick={() => navigate('groups/create')}>
                    Create Group&nbsp;&nbsp;&nbsp;
                </Button>
                <Button variant="contained" startIcon={<AddCircle/>}  size="large">
                    Create Expense
                </Button>
            </ButtonStack>

            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 10 }}>
                Features
            </Typography>
            
            <FeatureTypography variant="subtitle1" maxWidth="md" >
                <Stack spacing={3} >
                    <ShowFeature 
                        title="Straight to the Point." 
                        subtitle="Just add an expense and participants, and it's done. Without registration, app downloading and SMS." />
                    <ShowFeature 
                        title="Ads Free." 
                        subtitle="No annoying advertisements distracting an attention from the primary goal." />
                    <ShowFeature 
                        title="Open Source and Free." 
                        subtitle="All sources are available on a GitHub." />                        
                    <ShowFeature 
                        title="Public API." 
                        subtitle="Create your own UI or export expenses." />    
                    <ShowFeature 
                        title="Sharing." 
                        subtitle="To Share the group and expenses with participants just send the link from the app." />    
                    <ShowFeature 
                        title="Balance visualization." 
                        subtitle="See on a chart how much each participant spent." />  
                </Stack>
            </FeatureTypography>
        </MainContainer>
    )
}


const ShowFeature =(props: { title: string, subtitle: string }) => {
    return(
        <Stack direction="row">
        <ArrowRight fontSize="large"/>
        <Stack>
            <HighLightTypography>{props.title}</HighLightTypography>
            <FeatureItem>{props.subtitle}</FeatureItem>
        </Stack>
    </Stack> 
    )
}

export default Home;