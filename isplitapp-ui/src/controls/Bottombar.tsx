import { Box, Link, Paper, Typography, styled } from '@mui/material';


const Bar = styled(Paper)(({theme}) => ({
    marginTop: theme.spacing(6),
    backgroundColor: theme.palette.action.disabledBackground
}))

function Bottombar() {

    return(
        <Bar elevation={3} square>
            <Box sx={{ height: "60px", width:"100%", display:'flex'}}>
                <Box sx = {{ ml: 'auto', mt: 'auto'}}>
                    <Link sx={{ p: 1, pb:0, textAlign:'right', }} href="https://github.com/yet-an-other/isplitapp">GitHub</Link>
                    <Typography variant='subtitle2' sx={{ p: 1, pt: 0, fontWeight: 'bolder'}}>(c) Yet-an-other</Typography> 
                </Box>
            </Box>
            
        </Bar>
    );
}


export default Bottombar;