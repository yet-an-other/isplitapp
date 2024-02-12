import { PartyInfo } from "../api/contract/PartyInfo";
import Paper from "@mui/material/Paper/Paper";
import Box from "@mui/material/Box/Box";
import { PeopleAltOutlined } from "@mui/icons-material";
import Typography from "@mui/material/Typography/Typography";
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
        <Paper 
            elevation={0} 
            variant="outlined" 
            onClick={onClick} 
            sx={{ my: 2, p: 2, pb: 1, position: 'relative', borderColor: '#c2c2c2', borderRadius: '10px', overflow: 'hidden'}} 
        >
            <Box sx={{ position: 'absolute', overflow: 'hidden', left: '0px', top: '0px', bottom: '0px', width:'4px', backgroundColor: party.outstandingBalance !== 0 ? 'error.light' : 'success.light', opacity: .5}} />

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
            
            <Box height="28px" />

            <Box sx={{display: 'flex', flexDirection: 'row'}}>
                <Box sx={{ ml:'auto', pr: 2, display: 'flex', justifyContent:'end', alignItems: 'center', flexDirection:'column'}}>
                    <Typography variant="body2" sx={{lineHeight: 1.1, height: '22px', ml:'auto'}} component="div"><Fade>Transactions:</Fade></Typography>
                    <Typography variant="body2" sx={{lineHeight: 1.1, height: '22px', ml:'auto'}} component="div"><Fade>Outstanding:</Fade></Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{lineHeight: 1.1, height: '22px'}}>{party.totalTransactions}</Typography>
                    <Typography variant="subtitle1" sx={{lineHeight: 1.1, height: '22px'}}>{party.outstandingBalance}&nbsp;<Fade>{party.currency}</Fade></Typography>
                </Box>
            </Box>


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