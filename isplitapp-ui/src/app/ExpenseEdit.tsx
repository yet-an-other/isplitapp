import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormGroup, Grid, InputAdornment, InputLabel, MenuItem, Paper, Select, Typography } from "@mui/material";
import { AdaptiveInput, Fade, FloatFormatCustom, IntFormatCustom } from "../controls/StyledControls";
import { PartyInfo } from "../api/contract/PartyInfo";
import { useEffect, useState } from "react";
import { ExpensePayload } from "../api/contract/ExpensePayload";
import { BorrowerPayload } from "../api/contract/BorrowerPayload";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { createExpense, deleteExpense, fetchExpense, updateExpense } from "../api/expenseApi";
import { useErrorAlert } from "../controls/AlertProvider";
import { SplitMode } from "../api/contract/SplitMode";
import { ParticipantInfo } from "../api/contract/ParticipantInfo";

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

    let [validationResult, setValidationResult] = useState(new ExpenseValidator());
    let [isShowError, setIsShowErrors] = useState(false);
    let [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const paramsExpens = {
        title: title ?? "",
        borrowers: borrowerId 
            ? [{participantId: borrowerId, amount: 0, share: 1, percent: 0}] 
            : party.participants.map(p => {return {participantId: p.id, amount: 0, share: 1, percent: 0}}),
        lenderId: lenderId ?? party.participants[0].id,
        amount: Number.parseFloat(amount ?? "0"),
        isReimbursement: Boolean(JSON.parse(isReimbursement ?? "false")),
        date: new Date(Date.now()),
        splitMode: "Evenly" as SplitMode
    }
    
    let [expense, setExpense] = useState<ExpensePayload>(paramsExpens);

    useEffect(() => {

        setValidationResult(validatePayload(paramsExpens));
        if (!expenseId)
            return;

        fetchExpense(expenseId)
            .then(e => {
                let fixE = {...e, splitMode: e.splitMode ?? "Evenly" as SplitMode};
                setExpense(fixE);
                setValidationResult(validatePayload(fixE));
            })
            .catch(e=>{
                console.log(e);
                errorAlert("Something went wrong, unable to load expense. Please, try again later")
            })
        
    }, [expenseId]) // eslint-disable-line react-hooks/exhaustive-deps


    const handleOnChange = (event: { name: string, value: string }) => {

        let {name, value} = event;

        let normValue : string | Date | number | BorrowerPayload[] | boolean = value;
        if (name === 'date') {
            normValue = new Date(Date.parse(value));
        }

        if (name === 'amount') {
            if (value.charAt(0) === '0' && value.charAt(1) && value.charAt(1).match("[1-9]")) {
                value = value.slice(1)
            }
            normValue = Number.parseFloat(value);
        }

        if (name === 'isReimbursement') {
            normValue = !expense.isReimbursement
        }

        let newExpense : ExpensePayload;

        if (name === 'borrowers') {
            const ids = expense.borrowers.find(b => b.participantId === value) 
                ? expense.borrowers.filter(b => b.participantId !== value)
                : expense.borrowers.concat([{ participantId: value, amount: 0, share: 1, percent: 0}]);
            newExpense = { ...expense, borrowers: ids }
        } else 
        if (name === 'splitMode') {
            newExpense = splitEqualRecalculate(normValue as SplitMode);
        } else {
            newExpense = { ...expense, [name]: normValue, borrowers: [...expense.borrowers] }
        }

        setExpense(newExpense);
        setValidationResult(validatePayload(newExpense));
    }

    const handleBorrowerChange = (participantId: string, value: string) => {
        const borrower = expense.borrowers.find(b => b.participantId === participantId);
        if (!borrower)
            return;

        const newBorrowers = expense.borrowers.map(b => {
            if (b.participantId === participantId) {
                if (expense.splitMode === 'ByShare')
                    return { ...b, share: Math.trunc(Number.parseInt(value)) }
                if (expense.splitMode === 'ByPercentage')
                    return { ...b, percent: Number.parseInt(value) }
                if (expense.splitMode === 'ByAmount')
                    return { ...b, amount: Number.parseFloat(value) }
            }
            return b;
        })
        const newExpense = { ...expense, borrowers: newBorrowers }
        setExpense(newExpense);
        setValidationResult(validatePayload(newExpense));
    }

    const handleSelectionToggle = (mode: "all" | "none" | "evenly") => {
        const newExpense = mode === 'all' 
            ? { ...expense, borrowers: party.participants.map(p => {return {participantId: p.id, amount: 0, share: 1, percent: 0}}) }
            : { ...expense, borrowers: [] }
        setExpense(newExpense);
        setValidationResult(validatePayload(newExpense));
    }

    const formatDate =(value: Date) => {
        const date = new Date(value);
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    const handleUpdateExpense = async () => {

        setIsShowErrors(true);
        if (!Object.keys(validationResult).every(key=> validationResult[key as keyof ExpenseValidator].isValid))
            return;

        try {
            expenseId 
                ? await updateExpense(expenseId, expense)
                : await createExpense(party.id, expense);
            navigate(`/${party.id}/expenses`);
            navigate(0);
        }
        catch(e) {
            console.log(e)
            errorAlert("Something went wrong, unable to add expense. Please, try again later");
        }
    }

    const handleDeleteExpense = () => {
        if (!expenseId)
            return;

        setIsConfirmOpen(true);
    }

    const handleConfirmOk = async () => {
        try {
            await deleteExpense(expenseId!);
            navigate(`/${party.id}/expenses`);
            navigate(0);
        }
        catch(e) {
            console.log(e)
            errorAlert("Something went wrong, unable to delete expense. Please, try again later");
        }
    }

    const splitEqualRecalculate = (mode: SplitMode) => {
         
        const muAmount = (amount: number) => amount * 100;
        const fuAmount = (amount: number) => amount / 100;

        const borrowers = expense.borrowers.map((b, i) => {
            return {
                ...b,
                share: mode === 'ByShare' ? 1 : 0,
                percent: mode === 'ByPercentage' 
                ? Math.trunc(100 / expense.borrowers.length) 
                    + (i < 100 % expense.borrowers.length ? 1 : 0)
                : 0,
                amount: mode === 'ByAmount' 
                ? fuAmount(
                    Math.trunc(muAmount(expense.amount) / expense.borrowers.length) 
                    + (i < muAmount(expense.amount) % expense.borrowers.length ? 1 : 0)
                )
                : 0
            }
        })
        return {...expense, splitMode: mode, borrowers: borrowers};
    }

    const showSplit = (participant: ParticipantInfo) => {
        const borrower = expense.borrowers.find(b => b.participantId === participant.id);
        if (!borrower)
            return 0;

        if (expense.splitMode === 'ByShare') {
            return borrower.share;
        }
        if (expense.splitMode === 'ByPercentage') {
            return borrower.percent;
        }
        return borrower.amount;
    }

    const isAllSelected = () => expense.borrowers.length === party.participants.length;
    const isNoneSelected = () => expense.borrowers.length === 0;

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
                            name="title"
                            onChange={e => handleOnChange(e.target) }
                            error={isShowError && !validationResult.title.isValid}
                            helperText={
                                isShowError && !validationResult.title.isValid 
                                    ? validationResult.title.errorMessage
                                    : "For what the money has been spent on"
                                }
                        />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ pb: 4, pl: { xs: 0, sm: 2 } }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            value = { expense.amount }
                            label="Amount"
                            name="amount"
                            onChange={e => handleOnChange(e.target)}
                            InputProps={{
                                inputComponent: FloatFormatCustom as any,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        { party.currency }
                                    </InputAdornment>
                                )
                            }}
                            error={isShowError && !validationResult.amount.isValid}
                            helperText={
                                isShowError && !validationResult.amount.isValid 
                                    ? validationResult.amount.errorMessage
                                    : "How much has been spent"
                                }
                        /> 
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ pb: 4, pr: { xs: 0, sm: 2 }  }}>
                        <AdaptiveInput
                            required
                            fullWidth
                            select
                            label="Paid by"
                            value = { expense.lenderId }
                            name="lenderId"
                            onChange = {e => handleOnChange(e.target) }
                            error={isShowError && !validationResult.lenderId.isValid}
                            helperText={
                                isShowError && !validationResult.lenderId.isValid 
                                    ? validationResult.lenderId.errorMessage
                                    : "Who has paid"
                                }
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
                            name="date"
                            onChange={e => handleOnChange (e.target)}
                            error={isShowError && !validationResult.date.isValid}
                            helperText={
                                isShowError && !validationResult.date.isValid 
                                    ? validationResult.date.errorMessage
                                    : "When money hase been spent"
                                }
                        /> 
                    </Grid>
                    <Grid item xs={12} sx={{display:'flex', alignItems:'start', justifyContent:'start'}}>
                        <FormControlLabel 
                            control={<Checkbox checked={expense.isReimbursement} />} 
                            label="Reimbursement"
                            onChange={() => handleOnChange({name:'isReimbursement', value: ''})} /> 
                    </Grid>
                </Grid>

                <Box sx={{ p: 2, pt: 0 }}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Typography variant="h5" sx={{ pt:1 }}>
                                <b>Paid for</b>
                            </Typography>
                            <Typography variant="caption" >
                                <Fade>Who participated in spending</Fade>
                            </Typography>
                        </Grid>



                        <Grid item xs={6} sx={{display:'flex', alignItems:'center', justifyContent:'start'}}>
                            <Button
                                disabled={isAllSelected()}
                                sx={{ fontWeight: 'bold', mt: 1, alignSelf: 'start', color: 'secondary.main' }} 
                                onClick={() => handleSelectionToggle('all')}>
                                all
                            </Button>
                            <Button
                                disabled={isNoneSelected()} 
                                sx={{ fontWeight: 'bold', mt: 1, alignSelf: 'start', color: 'secondary.main'}}
                                component="a" onClick={() => handleSelectionToggle('none')}>
                                none
                            </Button>

                        </Grid>

                        <Grid item xs={6}>
                            <FormControl fullWidth size="small" sx={{mt: 1, ml:'auto'}}>
                                <InputLabel>Split by</InputLabel>
                                <Select
                                    label="Split by"
                                    value={expense.splitMode}
                                    onChange={e => handleOnChange({name: 'splitMode', value: e.target.value as SplitMode}) }
                                >
                                    <MenuItem value={'Evenly'}>Evenly</MenuItem>
                                    <MenuItem value={'ByShare'}>By shares</MenuItem>
                                    <MenuItem value={'ByPercentage'}>By percentage</MenuItem>
                                    <MenuItem value={'ByAmount'}>By amount</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: isShowError && !validationResult.borrowers.isValid ? 'block' : 'none', mt: 2}}>
                                {
                                    validationResult.borrowers.errorMessages
                                    .map((m, i) => <Typography key={i} variant="caption" component="div" sx={{ color: 'error.main' }} >{m}</Typography>)
                                }
                            </Box>
                        </Grid>
                    </Grid>
                    
                        <FormGroup sx={{ mt: 2 }}>
                            {party.participants.map(p => 
                                <Box key={p.id} sx={{display: 'flex', flexDirection: 'row'}}>
                                    <Box >
                                    <FormControlLabel 
                                        control={<Checkbox checked={expense.borrowers.find(i => i.participantId === p.id) ? true : false } />} 
                                        label={p.name} 
                                        sx={{ display: 'block', textOverflow: 'ellipsis', overflow: 'hidden' }}
                                        onChange={() => handleOnChange({ name: 'borrowers', value: p.id })} />
                                    </Box>
                                    {expense.splitMode !== 'Evenly' && (
                                    <AdaptiveInput
                                        sx={{width: '120px', minWidth: '120px', ml: 'auto'}}
                                        value={showSplit(p)}
                                        disabled={expense.borrowers.find(i => i.participantId === p.id) ? false : true}
                                        onChange={e => handleBorrowerChange(p.id, e.target.value)}  
                                        InputProps={{
                                            sx: { textAlign: "right", "& input": { textAlign: "right" }},
                                            inputComponent: (expense.splitMode === 'ByAmount' ? FloatFormatCustom : IntFormatCustom) as any,
                                            endAdornment:  expense.splitMode !== 'ByShare' && (
                                                <InputAdornment 
                                                    position="end" 
                                                    sx={{ backgroundColor: '#f7f7f7', py: '18px', px: 1, ml: .5, mr: -1.6}}>
                                                    { expense.splitMode === 'ByAmount' ? party.currency: "%" }
                                                </InputAdornment>
                                            )
                                        }}   
                                    />
                                    )}
                                </Box>

                            )}
                        </FormGroup>
                    
                </Box>
            </Paper>

            <Box sx={{ mt: 3, mb: 6, display: "flex", justifyContent:"flex-end"}}>
                <Button onClick={ () => handleDeleteExpense() } variant="contained" size="small"
                    disabled={!expenseId} 
                    sx={{backgroundColor: 'error.main', "&:hover":{backgroundColor: 'error.dark'}, mr:'auto'}}  >
                    Delete
                </Button>
                <Button onClick={ () => handleUpdateExpense() } variant="contained" size="small"  >
                    {expenseId ? "Update" : "Add" }
                </Button>
            </Box>

            <Dialog
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
            >
                <DialogTitle>
                    Delete expense?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This action cannot be undone and the expense will be deleted forever.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={() => handleConfirmOk()} >Ok</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

type ValidatorValueType = string | number | BorrowerPayload[] | boolean | Date | SplitMode;

class ExpenseValidator {
    title = {
        isValid: false,
        errorMessage: "'Title' must not be empty",
        validate: (_: ExpensePayload, value: ValidatorValueType) => typeof(value) === 'string' && value.trim().length > 0
    };
    amount = {
        isValid: false,
        errorMessage: "Paid amount must be non zero",
        validate: (_: ExpensePayload, value: ValidatorValueType) => typeof(value) === 'number' && value > 0
    };
    lenderId = {
        isValid: false,
        errorMessage: "Lender must be set",
        validate: (_: ExpensePayload, value: ValidatorValueType) => typeof(value) === 'string' && value.length === 16
    };
    date = {
        isValid: false,
        errorMessage: "Date must be set",
        validate: (_: ExpensePayload, value: ValidatorValueType) => !isNaN(Date.parse(value as string))
    }
    borrowers = {
        isValid: false,
        errorMessages: [""],
        validate: (expense: ExpensePayload, value: ValidatorValueType) => {
            let isValid = false;
            let messages = [""];
            isValid = Array.isArray(value) && value.length > 0
            !isValid && (messages = messages.concat("At least one participant must be selected"));
            if (expense.splitMode === 'ByPercentage') {
                isValid = (value as BorrowerPayload[]).reduce((acc, b) => acc + b.percent, 0) === 100
                !isValid && (messages = messages.concat("The sum of percents must be 100% "));
                let v = (value as BorrowerPayload[]).every(b => b.percent > 0);
                !v && (messages = messages.concat("Percent must be greater than 0"));
                isValid = isValid && v;
            }
            if (expense.splitMode === 'ByAmount') {
                isValid = (value as BorrowerPayload[]).reduce((acc, b) => acc + b.amount, 0) === expense.amount
                !isValid && (messages = messages.concat("The sum of amounts must be equal to the expense amount"));
                let v = (value as BorrowerPayload[]).every(b => b.amount > 0);
                !v && (messages = messages.concat("Amount must be greater than 0"));
                isValid = isValid && v;
            }
            if (expense.splitMode === 'ByShare') {
                isValid = (value as BorrowerPayload[]).every(b => b.share > 0)
                !isValid && (messages = messages.concat("Share must be greater than 0"));
            } 
            this.borrowers.errorMessages = messages;
            return isValid;
        }
    }
}

const validatePayload = (expensePayload: ExpensePayload) => {

    let validationResult = new ExpenseValidator();
    Object.keys(validationResult).forEach( key => {
        validationResult[key as keyof ExpenseValidator].isValid = validationResult[key as keyof ExpenseValidator]
            .validate(expensePayload, expensePayload[key as keyof ExpensePayload])
    })
    return validationResult;
}