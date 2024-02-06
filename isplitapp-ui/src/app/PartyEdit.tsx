import { Button, Container, Grid, IconButton, InputAdornment, Paper, Typography } from "@mui/material";
import { ChangeEvent, useEffect, useState } from "react";
import { PartyPayload } from "../api/contract/PartyPayload";
import { DeleteForeverOutlined, PersonAddAltOutlined, PersonOutlineOutlined } from "@mui/icons-material";
import { ParticipantPayload } from "../api/contract/ParticipantPayload";
import React from "react";
import { useErrorAlert } from "../controls/AlertProvider";
import { createParty, fetchParty, updateParty } from "../api/expenseApi";
import { useNavigate, useParams } from "react-router-dom";
import PartyMenuBar from "../controls/PartyMenuBar";
import { AdaptiveInput } from "../controls/StyledControls";


export default function PartyEdit() {

    const errorAlert = useErrorAlert();
    const navigate = useNavigate();
    let { partyId } = useParams();

    let [party, setParty] = useState<PartyPayload>(new PartyPayload());
    let [participants, setParticipants] = useState<ParticipantPayload[]>([{name: "Alice", id: ""}, {name: "Bob", id: ""}]);
    let [isNameFocus, setNameFocus] = useState(false);

    useEffect(() => {
        if (!partyId)
            return;

        fetchParty(partyId)
        .then(partyInfo => {
            setParticipants(partyInfo.participants);
            setParty(partyInfo);
        })
        .catch(e => {
            console.log(e);
            errorAlert("Something went wrong. Unable to fetch data from server, please, try again later.");
        });

    }, [partyId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handlePartyChange = (event: ChangeEvent<HTMLInputElement>) => {
        setParty({...party, [event.target.name]: event.target.value})
    }

    const handleAddParticipant = () => {
        setParticipants([...participants, {id: "", name: ""}]);
        setNameFocus(true);
      };

    const handleDeleteParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };
    
    const handleNameChange = (index: number, text: string) => {
        const updated = [...participants];
        updated[index].name = text;
        setParticipants(updated);
    }

    const handleCreateOrUpdateGroup = async (partyId: string | undefined) => {
        try {
            party.participants = participants;
            partyId ? await updateParty(partyId!, party) : await createParty(party);
            
            navigate("/groups")
        } catch(e) {
            console.log(e);
            errorAlert("Something went wrong. Unable to create group, please, try again later.");
        }
    }

    return (
        <Container>
            <PartyMenuBar partyId={partyId} />

            <Paper elevation={0} sx={{ borderRadius: '10px' }}>
                <Grid container>
                    <Grid item xs={12} sm={8} sx={{ pb: { xs: 2, sm: 5 }, px: 2, pt: 5 }}>
                        <AdaptiveInput
                            autoFocus
                            required
                            fullWidth
                            name="name"
                            value={ party.name }
                            label="Group Name"
                            helperText="e. g. 'Sailing in Croatia' or 'Party trip to Paris'."
                            onChange={handlePartyChange}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ px: 2, pb: 4, pt: { xs: 2, sm: 5 } }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            name="currency"
                            value={ party.currency }
                            label="Currency Symbol"
                            helperText="Will be using in all group expenses."
                            onChange={handlePartyChange}
                        /> 
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h4" sx={{fontWeight: 'bold', mt: 4, mb:2 }}>
                Participants
            </Typography>

            <Paper elevation={0} >
                <Grid container alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                    {participants.map((p, index) => (
                        <React.Fragment key={"name" + index}>
                            <Grid item xs={10} sx={{ px: 2, py: 1}} >
                                <AdaptiveInput
                                    autoFocus = {isNameFocus}
                                    label="Name"
                                    value={p.name || ""}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlineOutlined/>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={2} sx={{ px: 2, py: 1, display: "flex", justifyContent:"center"}}>
                                <IconButton aria-label="delete" onClick={() => handleDeleteParticipant(index)} >
                                    <DeleteForeverOutlined sx={{ fontSize: {sm: 35, xs: 30} }}/>
                                </IconButton>
                            </Grid>
                        </React.Fragment>
                    ))}
                    <Grid item xs={12} sx={{p: 2}}>
                        <IconButton aria-label="Add" onClick={handleAddParticipant} sx={{color: "primary.main"}}>
                            <PersonAddAltOutlined sx={{ fontSize: 35 }}/>
                        </IconButton>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container alignItems="center" sx={{ mt: 4, mb: 6 }}>
                <Grid item xs={12} sx={{ px: 2, display: "flex", justifyContent:"flex-end"}}>
                    <Button onClick={ () => handleCreateOrUpdateGroup(partyId) } variant="contained" size="small"  >
                        {partyId ? "Update" : "Create" }
                    </Button>
                </Grid>
            </Grid>

        </Container>
    )
}