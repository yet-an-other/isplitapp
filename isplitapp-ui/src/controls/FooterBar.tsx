import { Box, Link, Paper } from '@mui/material';
import curiosity from '../curiosity.gif'

const version = process.env.REACT_APP_VERSION;

export const BOTTOM_BAR_HEIGHT = "60px";

export default function FooterBar() {

    return(
        <Paper elevation={3} square sx={{ mt: 'auto', backgroundColor: 'background.paper'}}>
            <Box sx={{ height: BOTTOM_BAR_HEIGHT, width: '100%', display: 'flex' }}>
                <Box sx = {{ mr: 'auto', mt: 2, ml: 3, display: 'grid', flexDirection: 'column' }}>
                    
                    <Link href="https://github.com/yet-an-other/isplitapp" sx={{textDecoration: 'none', fontSize: '0.9rem'}}>
                        <b>{"//"}</b> {version}
                    </Link>

                </Box>
                <img src={curiosity} alt='curiosity' width={32} height={32} style={{ marginRight: 12, marginTop: 8 }} />
            </Box>
            
        </Paper>
    );
};