import { Box, Link, Paper, styled } from '@mui/material';
import curiosity from '../curiosity.gif'
//import { version } from '../../package.json';
const packageJson = require('../../package.json');

const Bar = styled(Paper)(({theme}) => ({
    marginTop: theme.spacing(6),
    backgroundColor: theme.palette.background.paper
}))

export const BOTTOM_BAR_HEIGHT = "60px";

export default function FooterBar() {

    return(
        <Bar elevation={3} square sx={{ marginTop: 'auto'}}>
            <Box sx={{ height: BOTTOM_BAR_HEIGHT, width: '100%', display: 'flex' }}>
                <Box sx = {{ mr: 'auto', mt: 2, ml: 3, display: 'grid', flexDirection: 'column' }}>
                    
                    <Link href="https://github.com/yet-an-other/isplitapp" sx={{textDecoration: 'none', fontSize: '0.9rem'}}>
                        <b>{"//"}</b> {packageJson.version}
                    </Link>

                </Box>
                <img src={curiosity} alt='curiosity' width={32} height={32} style={{ marginRight: 12, marginTop: 8 }} />
            </Box>
            
        </Bar>
    );
};