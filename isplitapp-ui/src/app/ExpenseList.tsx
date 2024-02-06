import { Button, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import { useErrorAlert } from "../controls/AlertProvider";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { fetchExpenseList } from "../api/expenseApi";
import { PartyInfo } from "../api/contract/PartyInfo";
import { Accent, Fade } from "../controls/StyledControls";


export default function ExpenseList() {

    const errorAlert = useErrorAlert();
    const navigate = useNavigate();
    const { partyId } = useParams();
    const party = useOutletContext<PartyInfo>();

    let [expenseList, setExpenseList] = useState([] as ExpenseInfo[]);
    
    useEffect(() => {
        if (!partyId)
            return;

        fetchExpenseList(partyId)
        .then(expenses => setExpenseList(expenses))
        .catch(e => {
            console.log(e);
            errorAlert("An unknown error has occurred. Please try again later.");
        });
    }, [partyId]) // eslint-disable-line react-hooks/exhaustive-deps


    return(
    <>
        <Stack direction="row" sx={{ mt: 5 }}>
            <Typography variant="h4" sx={{fontWeight: 'bold' }}>Espenses</Typography>
            <Button variant="contained" size="small" sx={{ ml: 'auto' }} onClick={()=> navigate(`/groups/${partyId}/expenses/create`)}>
                Add
            </Button>
        </Stack>
        <Typography variant="caption" sx={{ mt: -1 }}>
            <Fade>Here are the expenses and money transfers that happend in this group.</Fade>
        </Typography>

        <List component="nav" disablePadding>
            {expenseList.map((expense) => (
                <Fragment key={expense.id}>
                  
                    <Paper elevation={0} sx={{ px: 1, my: 1 }}>
                    <ListItem disableGutters>
                        <ListItemText
                            onClick={() =>  navigate(`/groups/${partyId}/expenses/${expense.id}/edit`)}
                            disableTypography
                            primary = {
                                <Typography variant="subtitle1">
                                    {expense.title}
                                </Typography>
                            }
                            secondary = {
                                <Typography variant="caption">
                                    <Accent>Paid by</Accent> <Fade>{expense.lenderName}</Fade> <br/> 
                                    <Accent>for</Accent> <Fade>{expense.borrowers.map(n => n.participantName).join(", ")}</Fade>
                                </Typography>
                            }
                        />
                        <Stack sx={{ whiteSpace: "nowrap", display: "flex", alignItems:"end", alignSelf:"end", mb: "6px" }}>
                            <Typography variant="h5">
                                {expense.amount}&nbsp;<Fade>{party.currency}</Fade>
                            </Typography>
                            <Typography variant="caption">
                                {new Date(expense.date).toDateString()}
                            </Typography>
                        </Stack>
                    </ListItem>
                    </Paper>
                    
                </Fragment>
            ))}

        </List>
    </>
    )
}