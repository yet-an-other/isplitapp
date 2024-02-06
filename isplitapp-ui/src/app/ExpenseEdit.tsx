import { Box, Button, Checkbox, FormControlLabel, FormGroup, Grid, InputAdornment, MenuItem, Paper, Typography } from "@mui/material";
import { AdaptiveInput, Fade, NumericFormatCustom } from "../controls/StyledControls";
import { PartyInfo } from "../api/contract/PartyInfo";
import { useEffect, useState } from "react";
import { ExpensePayload } from "../api/contract/ExpensePayload";
import { BorrowerPayload } from "../api/contract/BorrowerPayload";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { createExpense, fetchExpense, updateExpense } from "../api/expenseApi";
import { useErrorAlert } from "../controls/AlertProvider";


interface IDictionary {
    [index: string]: string;
}

function useQueryParams() {
    const [searchParams] = useSearchParams();
    let params = {} as IDictionary;
    searchParams.forEach((v,k) =>  {
        params[k] = v 
    })
    
    return params
}


export default function ExpenseEdit() {

    const { expenseId } = useParams();
    const errorAlert = useErrorAlert();
    const navigate = useNavigate();
    const party = useOutletContext<PartyInfo>();
    const { title, lenderId, borrowerId, amount, isReimbursement } = useQueryParams();

    let [expense, setExpense] = useState<ExpensePayload>({
        title: title ?? "",
        borrowers: [],
        lenderId: lenderId ?? party.participants[0].id,
        amount: Number.parseFloat(amount ?? "0"),
        isReimbursement: Boolean(JSON.parse(isReimbursement ?? "false")),
        date: new Date(Date.now())
    });
    let [borrowers, setBorrowers] = useState<BorrowerPayload[]>(borrowerId ? [{participantId: borrowerId}]: []);

    useEffect(() => {
        if (!expenseId)
            return;

        fetchExpense(expenseId)
            .then(e => {
                setExpense(e);
                setBorrowers(e.borrowers);
            })
            .catch(e=>{
                console.log(e);
                errorAlert("Something went wrong, unable to load expense. Please, try again later")
            })
        
    }, [expenseId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleTitleChange = (title: string) => {
        setExpense({ ...expense, title: title });
    }

    const handlePaidByChange = (lenderId: string) => {
        setExpense({ ...expense, lenderId: lenderId });
    }

    const handleDateChange = (date: string) => {
        setExpense({ ...expense, date: new Date(Date.parse(date)) });
    }

    const handlePaidForChange = (id: string) => {
        const ids = borrowers.find(b => b.participantId === id) 
            ? borrowers.filter(b => b.participantId !== id)
            : borrowers.concat([{ participantId: id }]);
        setBorrowers(ids);
    }

    const formatDate =(value: Date) => {
        const date = new Date(value);
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    const handleReimbursementChange = () => {
        setExpense({ ...expense, isReimbursement: !expense.isReimbursement });
    }

    const handleCustomAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value;
        if (value.charAt(0) === '0') {
            if (value.charAt(1) && value.charAt(1).match("[1-9]")) {
                value = value.slice(1)    
            }
        }
        setExpense({...expense, amount: Number.parseFloat(value)})
    }

    const handleUpdateExpense = async () => {
        expense.borrowers = borrowers;
        try {
            expenseId 
                ? await updateExpense(expenseId, expense)
                : await createExpense(party.id, expense);
            navigate(`/groups/${party.id}/expenses`);
            navigate(0);
        }
        catch(e) {
            console.log(e)
            errorAlert("Something went wrong, unable to add expense. Please, try again later");
        }
    }

    return (
        <>
            <Typography variant="h4" sx={{fontWeight: 'bold', mt: 3, mb: 1}}>
                { expenseId ? "Edit" : "New" } Expense
            </Typography>

            <Paper elevation={0}>
                <Grid container sx={{ p: 2 }}>
                    <Grid item xs={12} sm={8} sx={{ pb: 4, pr: { xs: 0, sm: 2 }  }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            value = { expense.title }
                            label="Expense Title"
                            helperText="What was the expense about"
                            onChange={ e => handleTitleChange(e.target.value) }
                        />
                        
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ pb: 4, pl: { xs: 0, sm: 2 } }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            value = { expense.amount }
                            label="Amount"
                            helperText="How much has been spent"
                            onChange={handleCustomAmountChange}
                            InputProps={{
                                inputComponent: NumericFormatCustom as any,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        { party.currency }
                                    </InputAdornment>
                                )
                            }}
                        /> 
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ pb: 4, pr: { xs: 0, sm: 2 }  }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            select
                            label="Paid by"
                            helperText="Who was paying for"
                            value = { party.participants.find(p => p.id === expense.lenderId)?.id ?? party.participants[0]?.id ?? ""  }
                            onChange = { e => handlePaidByChange(e.target.value) }
                        >
                            {party.participants.map((p) => (
                                <MenuItem key={p.id} value={p.id} >
                                    {p.name}
                                </MenuItem>
                            ))}
                        </AdaptiveInput>
                        
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ pb: 2, pl: { xs: 0, sm: 2 } }}>
                        <AdaptiveInput
                            type="date"
                            required
                            fullWidth
                            value = { formatDate(expense.date) }
                            label="Expense date"
                            helperText="When money hase been spent"
                            onChange={ e => handleDateChange(e.target.value) }
                        /> 
                    </Grid>
                </Grid>

                <Box sx={{ p: 2, pt: 0 }}>
                    <Grid container>
                        <Grid item xs={6}>
                            <Typography variant="h5" sx={{ pt:1 }}>
                                <b>Paid for</b>
                            </Typography>
                            <Typography variant="caption" >
                                <Fade>Who participated in spending</Fade>
                            </Typography>
                        </Grid>
                        <Grid item xs={6} sx={{display:'flex', alignItems:'start', justifyContent:'end'}}>
                            <FormControlLabel 
                                sx={{ m:0 }}
                                control={<Checkbox checked={expense.isReimbursement} />} 
                                label="Reimbursement" 
                                onChange={() => handleReimbursementChange()} /> 
                        </Grid>
                    </Grid>
                    <FormGroup sx={{mt:2}}>
                        {party.participants.map(p => 
                            <FormControlLabel 
                                key={p.id}
                                control={<Checkbox checked={borrowers.find(i => i.participantId === p.id) ? true : false } />} 
                                label={p.name} 
                                onChange={()=>handlePaidForChange(p.id)} />
                        )}
                    </FormGroup>
                </Box>
            </Paper>

            <Box sx={{ mt: 3, mb: 6, display: "flex", justifyContent:"flex-end"}}>
                <Button onClick={ () => handleUpdateExpense() } variant="contained" size="small"  >
                    {expenseId ? "Update" : "Add" }
                </Button>
            </Box>
        </>
    )
}

