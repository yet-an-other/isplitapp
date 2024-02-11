import { PartyInfo } from "../api/contract/PartyInfo";
import Paper from "@mui/material/Paper/Paper";
import Box from "@mui/material/Box/Box";
import { PeopleAltOutlined } from "@mui/icons-material";
import Typography from "@mui/material/Typography/Typography";
import Grid from "@mui/material/Grid/Grid";
import { Accent, Fade } from "./StyledControls";
import React from "react";
import { SxProps, Theme } from "@mui/material/styles";

interface PartyCardProps {
    party: PartyInfo,
    ActionIcon: React.ElementType
    onClick?: (() => void)
}

export interface ActionIconProps {
    partyId: string | null,
    sx: SxProps<Theme> | undefined
}

export const PartyCard = ({party, ActionIcon, onClick}: PartyCardProps) => {

    return (
        <Paper elevation={0} onClick={onClick} sx={{ my: 2, p: 2, pb: 1, position: 'relative' }} >
            <Box sx={{ position: 'absolute', left: '0px', top: '0px', bottom: '0px', width:'4px', backgroundColor: party.outstandingBalance !== 0 ? 'error.light' : 'success.light', opacity: .5}} />

            <Box>
                <Box sx={{ whiteSpace: 'nowrap', float: 'left', mr: 1 }}>
                    <PeopleAltOutlined fontSize="small" sx={{ color: "primary.main" }} />
                    <Typography variant="body2" component='span'>
                        &nbsp;<b>{party.totalParticipants}</b>
                    </Typography>
                </Box>

                <ActionIcon partyId={party.id} sx={{ mt: -1.5, mr: -1, float: 'right' }} />

                <Typography variant="subtitle1" sx = {{ mt: 0, lineHeight: 1.66 }}>
                    {party.name}
                </Typography>
            </Box>
            
            <Box height="16px" />

            <Grid container>
                <Grid item xs={8} sx={{ display: 'flex', justifyContent:'end', alignItems: 'center'}}>
                    <Typography variant="body2" sx={{lineHeight: 1.1}}><Fade>Transactions:</Fade></Typography>
                </Grid>
                <Grid item xs={4} sx={{pl: 1 }}>
                    <Typography variant="subtitle1" sx={{lineHeight: 1.1}}>{party.totalTransactions}</Typography>
                </Grid>
                <Grid item xs={8} sx={{ display: 'flex', justifyContent:'end', alignItems: 'center'}}>
                    <Typography variant="body2" sx={{lineHeight: 1.1}}><Fade>Outstanding:</Fade></Typography>
                </Grid>
                <Grid item xs={4} sx={{pl: 1}}>
                    <Typography variant="subtitle1" sx={{lineHeight: 1.1}}>{party.outstandingBalance}&nbsp;<Fade>{party.currency}</Fade></Typography>
                </Grid>

            </Grid>

            <Box sx={{ display: 'flex', flexDirection:'row' }}>
                <Typography variant="h5" sx={{mt: 'auto'}}>
                    <Accent>{party.totalExpenses}</Accent>&nbsp;<Fade>{party.currency}</Fade>
                </Typography>
                <Typography variant="body2" sx={{ ml: 'auto', mt:'auto' }}>
                    {new Date(party.created).toDateString()}
                </Typography>
            </Box>

        </Paper>
    )
}