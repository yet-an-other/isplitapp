import { AddCircle, IosShare, Menu as MenuIcon, VisibilityOffOutlined, } from "@mui/icons-material"
import { Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Menu, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { fetchPartyList, unfollowParty } from "../api/expenseApi";
import { useErrorAlert, useSuccessAlert } from "../controls/AlertProvider";
import { Fade, RouterLink } from "../controls/StyledControls";
import { shareLink } from "../util";
import React from "react";
import { ActionIconProps, PartyCard } from "../controls/PartyCard";

export const PartyList = () => {

    let [partyList, setPartyList] = useState([] as PartyInfo[]);
    let [isUrlOpen, setUrlOpen] = useState(false);
    let [partyUrl, setPartyUrl] = useState("");
    const errorAlert = useErrorAlert();

    useEffect(() => {
        fetchPartyList()
        .then(parties => setPartyList(parties))
        .catch(_ => errorAlert("An unknown error has occurred. Please try again later."));
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const navigate = useNavigate();

    const handleAddLink = () => {
        setUrlOpen(false);
        const match = partyUrl.match("(^|/)([a-zA-Z]{16})($|/)");
        setPartyUrl("");
        if (!match || !match[2]){
            errorAlert("Cannot find party id");
            return;
        }

        navigate(`/groups/${match[2]}/expenses`);
    }

    return (
        <>
            <Container sx={{ my: 2 }}>
                <Stack direction="row">
                    <Typography variant="h4" sx={{ fontWeight: 'bolder' }}>
                        Groups
                    </Typography>
                    <Button variant="outlined" sx={{ ml: 'auto' }} onClick={() => {setUrlOpen(true)}}>
                        Add by URL
                    </Button>
                    <Button variant="contained" sx={{ ml: 1 }} onClick={() => navigate('create')}>
                        <AddCircle/>&nbsp;Create
                    </Button>
                </Stack>
                { 
                    partyList.length > 0 
                        ? partyList.map(party => <PartyCard 
                            ActionIcon={PartyInListMenu}
                            party={party}
                            onClick={() => navigate(`/groups/${party.id}/expenses`)} 
                            key={party.id}/>) 
                        : <EmptyList/> 
                }
            </Container>

            <Dialog
                open={isUrlOpen}
                onClose={ () => {setUrlOpen(false); setPartyUrl("");} }
            >
                <DialogTitle>
                    Add group by link
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        If someone has shared a group with you, you can simply paste its URL here to include it in your list
                        <TextField 
                            variant="outlined"
                            fullWidth
                            value={ partyUrl }
                            label="URL"

                            onChange={e => setPartyUrl(e.target.value)}
                            sx={{mt: 2}}
                        >

                        </TextField>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {setUrlOpen(false); setPartyUrl("");}}>Cancel</Button>
                    <Button onClick={() => handleAddLink()} autoFocus>Add</Button>
                </DialogActions>
            </Dialog>
        </>
    )
} 

const EmptyList = () => {
    return (
        <Typography variant="body1" sx={{ mt: 4 }}>
            <Fade>
                It seems you have not visited any group yet... <br/> 
                You may <RouterLink to="create" >create a new group</RouterLink> or ask a friend to send you the link to an existing one. 
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

    const handleConfirmOk = async () => {
        try {
            partyId && await unfollowParty(partyId);
            setConfirmOpen(false);
            navigate(0);
        }
        catch(e){
            console.log(`unable unfollow group ${e}`);
        }
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
                    <Button onClick={e => { e.stopPropagation(); handleConfirmClose(); }}>Cancel</Button>
                    <Button onClick={e => { e.stopPropagation(); handleConfirmOk(); }}>Ok</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
