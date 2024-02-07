import { AddCircle, IosShare, Menu as MenuIcon, VisibilityOffOutlined, } from "@mui/icons-material"
import { Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, Stack, Typography, styled } from "@mui/material"
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { fetchPartyList, unfollowParty } from "../api/expenseApi";
import { useErrorAlert, useSuccessAlert } from "../controls/AlertProvider";
import { Fade } from "../controls/StyledControls";
import { shareLink } from "../util";
import React from "react";
import { ActionIconProps, PartyCard } from "../controls/PartyCard";

export const PartyList = () => {

    let [partyList, setPartyList] = useState([] as PartyInfo[]);
    const errorAlert = useErrorAlert();

    useEffect(() => {
        fetchPartyList()
        .then(parties => setPartyList(parties))
        .catch(_ => errorAlert("An unknown error has occurred. Please try again later."));
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const navigate = useNavigate();

    return (
        <Container sx={{ my: 2 }}>
            <Stack direction="row">
                <Typography variant="h4" sx={{ fontWeight: 'bolder' }}>
                    Groups
                </Typography>
                <Button variant="contained" sx={{ ml: 'auto' }} onClick={() => navigate('create')}>
                    <AddCircle/>&nbsp;Create
                </Button>
            </Stack>
            { 
                partyList.length > 0 
                    ? partyList.map(party => <PartyCard 
                        ActionIcon={PartyInListMenu}
                        party={party} 
                        key={party.id}/>) 
                    : <EmptyList/> 
            }
        </Container>
    )
} 

const CreateLink = styled(Link)(({theme})=>({
    "&:visited, &:link": {
        color: theme.palette.secondary.main,

    }
}))

const EmptyList = () => {
    return (
        <Typography sx={{ mt: 4 }}>
            <Fade>
                It seems you have not visited any group yet... <br/> 
                You may <CreateLink to="create" >create a new group</CreateLink> or ask a friend to send you the link to an existing one. 
            </Fade>
        </Typography>
    )
}



const PartyInListMenu = ({partyId, sx}: ActionIconProps) => {
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const successAlert = useSuccessAlert();
    const navigate = useNavigate();

    const [isConfirmOpen, setConfirmOpen] = useState(false);

    const handleMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        setAnchorEl(event.currentTarget);
    }

    const handleClose = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        setAnchorEl(null);
        event.stopPropagation();
    }    

    const handleShare = async () => {
        if (await shareLink(`${window.location.origin}/groups/${partyId}/expenses`))
            successAlert("The link has been successfully copied");
        setAnchorEl(null);
    }    

    const handleConfirmClose = () => {
        setConfirmOpen(false);
    }

    const handleConfirmOk = () => {
        partyId && unfollowParty(partyId);
        setConfirmOpen(false);
        navigate(0);
    }

    const handleUnfollow = async () => {
        setConfirmOpen(true);
        setAnchorEl(null);
    }

    return(
        <>
            <IconButton sx={sx} onClick={handleMenu}>
                <MenuIcon />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem onClick={e => {handleShare(); e.stopPropagation();}}>
                    <Typography variant="body2">Share Group</Typography>
                    <IosShare fontSize="small" sx={{ml: 'auto'}}/>
                </MenuItem>
                <MenuItem onClick={e => {handleUnfollow(); e.stopPropagation();}}>
                    <Typography variant="body2">Unfollow Group</Typography>
                    <VisibilityOffOutlined fontSize="small" sx={{ml: 3, color: 'error.main'}}/>
                </MenuItem>
            </Menu>

            <Dialog
                open={isConfirmOpen}
                onClose={ e => { handleConfirmClose(); (e as any).stopPropagation && (e as any).stopPropagation();}}
            >
                <DialogTitle>
                    Unfollow the group?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        You'll be following the group back automatically, if visiting it again.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={e => {handleConfirmClose(); e.stopPropagation(); }}>Cancel</Button>
                    <Button onClick={e => {handleConfirmOk(); e.stopPropagation(); }} autoFocus>Ok</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
