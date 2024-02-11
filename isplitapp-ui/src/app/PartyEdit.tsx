import { Button, Container, Grid, IconButton, InputAdornment, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
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

    let initParty = new PartyPayload();
    initParty.participants = [{name: "Alice", id: "", canDelete: true}, {name: "Bob", id: "", canDelete: true}]

    let [party, setParty] = useState<PartyPayload>(initParty);
    let [isNameFocus, setNameFocus] = useState(false);   

    let [validationResult, setValidationResult] = useState(new PartyValidator());
    let [isShowErrors, setIsShowErrors] = useState(false);
    
    useEffect(() => {
        setValidationResult(validatePayload(initParty))
        if (!partyId)
            return;

        fetchParty(partyId)
        .then(partyInfo => {
            setParty(partyInfo);
            setValidationResult(validatePayload(partyInfo))
        })
        .catch(e => {
            console.log(e);
            errorAlert("Something went wrong. Unable to fetch data from server, please, try again later.");
        });

    }, [partyId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleOnChange = (event: {name: string, value: string}) => {
        let { name, value } = event;

        const newParty = {...party, [name]: value, participants:[...party.participants]};
        setParty(newParty);
        setValidationResult(validatePayload(newParty));
    }

    const handleAddParticipant = () => {
        const newParty = {...party, participants:[...party.participants, {id: "", name: "", canDelete: true}]};
        setParty(newParty);
        setValidationResult(validatePayload(newParty));
        setNameFocus(true);
    };

    const handleDeleteParticipant = (index: number) => {
        const newParty = {...party, participants: party.participants.filter((_, i) => i !== index)};
        setParty(newParty);
        setValidationResult(validatePayload(newParty));
    };
    
    const handleNameChange = (index: number, text: string) => {
        const updated = [...party.participants];
        updated[index].name = text;
        const newParty = {...party, participants: updated};
        setParty(newParty);
        setValidationResult(validatePayload(newParty));
    }

    const handleCreateOrUpdateGroup = async (partyId: string | undefined) => {

        setIsShowErrors(true);
        if (!Object
            .keys(validationResult)
            .every(key=> validationResult[key as keyof PartyValidator].isValid))
            return;

        try {
            partyId ? await updateParty(partyId!, party) : await createParty(party);
            navigate("/groups")
        } catch(e) {
            console.log(e);
            errorAlert("Something went wrong. Unable to create group, please, try again later.");
        }
    }

    const isParticipantsError = isShowErrors && 
        !validationResult.participants.isValid && 
        party.participants.length === 0

    return (
        <Container>
            <PartyMenuBar partyId={partyId} />
            <Typography variant="body2" sx={{color: 'text.disabled', mt: -2, mb: 3}}>
                Get started now by creating a group of participants to share expenses with
            </Typography>
            <Paper elevation={0}>
                <Grid container>
                    <Grid item xs={12} sm={8} sx={{ pb: { xs: 2, sm: 5 }, px: 2, pt: 5 }}>
                        <AdaptiveInput
                            autoFocus
                            required
                            fullWidth
                            name="name"
                            value={ party.name }
                            label="Group Name"
                            helperText={
                                !validationResult.name.isValid && isShowErrors
                                    ? validationResult.name.errorMessage
                                    : "E. g. 'Sailing in Croatia' or 'Party trip to Paris'."
                            }
                            onChange={e => handleOnChange(e.target)}
                            error = { !validationResult.name.isValid && isShowErrors}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ px: 2, pb: 4, pt: { xs: 2, sm: 5 } }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            name="currency"
                            value={ party.currency }
                            label="Currency"
                            helperText={
                                !validationResult.currency.isValid && isShowErrors
                                    ? validationResult.currency.errorMessage
                                    : "Will be used in all group expenses."
                            }
                            onChange={e => handleOnChange(e.target)}
                            error={ !validationResult.currency.isValid && isShowErrors }
                        /> 
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h4" sx={{fontWeight: 'bold', mt: 4, mb:2 }}>
                Participants
            </Typography>

            <Paper elevation={0} >
                <Grid container alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                    <Typography 
                        variant="caption" 
                        sx={{ display: isParticipantsError ? 'block' : 'none', color: 'error.main' }}>
                        {validationResult.participants.errorMessage}
                    </Typography>
                    {party.participants.map((p, index) => (
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
                                    error={isShowErrors && (!(p.name) || p.name.trim().length === 0)}
                                    helperText={(isShowErrors && (!(p.name) || p.name.trim().length === 0)) && "Participant name must not be empty" }
                                />
                            </Grid>
                            <Grid item xs={2} sx={{ px: 2, py: 1, display: "flex", justifyContent:"center"}}>
                                <IconButton onClick={() => handleDeleteParticipant(index)} disabled={!party.participants[index].canDelete} >
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


class PartyValidator {
    name = {
        isValid: false,
        errorMessage: "Group Name must not be empty",
        validate: (value: ParticipantPayload[] | string) => typeof(value) === 'string' && value.trim().length > 0
    };
    currency = {
        isValid: false,
        errorMessage: "Currency must not be empty",
        validate: (value: ParticipantPayload[] | string) => typeof(value) === 'string' && value.trim().length > 0
    };
    participants = {
        isValid: true,
        errorMessage: "Must be at least one participant in the group",
        validate: (value: ParticipantPayload[] | string) => {
            return Array.isArray(value) && value.length > 0 && value.every(p => p.name.trim().length > 0)
        }
    }
} 

const validatePayload = (partyPayload: PartyPayload) => {

    let validationResult = new PartyValidator();
    Object.keys(validationResult).forEach( key => {
        validationResult[key as keyof PartyValidator].isValid = validationResult[key as keyof PartyValidator]
            .validate(partyPayload[key as keyof PartyPayload])
    })
    return validationResult;
}