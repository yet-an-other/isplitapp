import { Box, Button, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import { useErrorAlert } from "../controls/AlertProvider";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { fetchExpenseList } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { Accent, Fade, LoadingPartyContent, RouterLink } from "../controls/StyledControls";

export default function ExpenseList() {

    const errorAlert = useErrorAlert();
    const navigate = useNavigate();
    const { partyId } = useParams();
    const party = useOutletContext<PartyInfo>();

    let [expenseList, setExpenseList] = useState([] as ExpenseInfo[]);
    let [isLoading, setLoading] = useState(true);   
    
    useEffect(() => {
        if (!partyId)
            return;

        fetchExpenseList(partyId)
        .then(expenses => setExpenseList(expenses))
        .catch(e => {
            console.log(e);
            errorAlert("An unknown error has occurred. Please try again later.");
        })
        .finally(() => setLoading(false));
    }, [partyId]) // eslint-disable-line react-hooks/exhaustive-deps

    return(
    <>
        <Stack direction="row" sx={{ mt: 5 }}>
            <Box>
                <Typography variant="h4" sx={{fontWeight: 'bold' }}>Expenses</Typography>
                <Typography variant="body2" sx={{ mt: .5, mb: 3 }}>
                    <Fade>Explore the group's expenses and money transfers here</Fade>
                </Typography>
            </Box>
            <Button variant="contained" size="small" sx={{ ml: 'auto', height: 32 }} onClick={()=> navigate(`/groups/${partyId}/expenses/create`)}>
                Add
            </Button>
        </Stack>
        
        <LoadingPartyContent isLoading={isLoading}>
            {(expenseList && expenseList.length > 0) 
            ? <FullList party={party} expenseList={expenseList} /> 
            : <EmptyList partyId={partyId!} /> }
        </LoadingPartyContent>
    </>
    )
}

const EmptyList = (props: {partyId: string}) => {
    return (
        <Typography sx={{ mt: 4 }} variant="body1">
            <Fade>
                It seems you have not added any expense yet... 
                Start with <RouterLink to={`/groups/${props.partyId}/expenses/create`} >add</RouterLink> expense. 
            </Fade>
        </Typography>
    )
}

interface FullListProps {
    party: PartyInfo
    expenseList: ExpenseInfo[],
}

const FullList =({party, expenseList}: FullListProps) => {

    const navigate = useNavigate();

    return(
    <List component="nav" disablePadding>
    {expenseList.map((expense) => (
        <Fragment key={expense.id}>
            <Paper elevation={0} sx={{ px: 1, my: 1 }}>
            <ListItem disableGutters>
                <ListItemText
                    onClick={() =>  navigate(`/groups/${party.id}/expenses/${expense.id}/edit`)}
                    disableTypography
                    primary = {
                        <Typography variant="subtitle1" sx={{mb: 2}}>
                            {expense.title}
                        </Typography>
                    }
                    secondary = {
                        <Typography variant="body2">
                            <Accent>Paid by</Accent> <Fade>{expense.lenderName}</Fade> <br/> 
                            <Accent>for</Accent> <Fade>{expense.borrowers.map(n => n.participantName).join(", ")}</Fade>
                        </Typography>
                    }
                />
                <Stack sx={{ whiteSpace: "nowrap", display: "flex", alignItems:"end", alignSelf:"end", mb: "6px" }}>
                    <Typography variant="h5">
                        {expense.amount}&nbsp;<Fade>{party.currency}</Fade>
                    </Typography>
                    <Typography variant="body2">
                        {new Date(expense.date).toDateString()}
                    </Typography>
                </Stack>
            </ListItem>
            </Paper>
        </Fragment>
    ))}
    </List>
    )
}