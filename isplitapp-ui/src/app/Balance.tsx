import { Box, Container, Paper, Stack, Typography, styled } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { fetchBalance } from "../api/expenseApi";
import { BalanceInfo } from "../api/contract/BalanceInfo";
import { useErrorAlert } from "../controls/AlertProvider";
import { Fade } from "../controls/StyledControls";
import { BalanceEntry } from "../api/contract/BalanceEntry";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ReimburseEntry } from "../api/contract/ReimburseEntry";


const MarkLink = styled(Link)(({theme}) =>({
    fontWeight: 'bold',
    textDecoration: 'none',
    color: theme.palette.primary.main
    
}))

export default function Balance() {

    const errorAlert = useErrorAlert();
    const { partyId } = useParams();
    const party = useOutletContext<PartyInfo>();
    let [balanceInfo, setBalance] = useState<BalanceInfo>(new BalanceInfo())

    useEffect(()=>{
        if (!partyId)
            return;

        fetchBalance(partyId)
        .then(b => setBalance(b))
        .catch(e => {
            console.log(e);
            errorAlert("An unknown error has occurred. Please try again later.");
        })
    }, [partyId]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Container disableGutters>
            <Typography variant="h4" sx={{fontWeight: 'bold', mt: 4  }}>
                Balance
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, mt: .5 }} component="div">
                <Fade>Here is the total amount each participant borrowed or paid for</Fade>
            </Typography>

            {balanceInfo.reimbursements.length > 0
                ? <>
                    <BalanceChart balances={balanceInfo.balances} party={party}/>
                    <Typography variant="h4" sx={{fontWeight: 'bold', mt: 4  }}>
                        Suggested Reimbursements
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 3, mt: .5 }} component="div">
                        <Fade>Here are some tips to make sure everyone gets their fair share back</Fade>
                    </Typography>
                    <ReimbursementList reimbursements={balanceInfo.reimbursements} party={party}/>
                  </>
                : <EmptyReimbursements party={party} />
            }
        </Container>
    )
}



function BalanceChart(props: {balances: BalanceEntry[], party: PartyInfo}) {

    const maxBalance = Math.max(...Object.values(props.balances).map(b=>Math.abs(b.amount)));

    return(
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column'}}> 
            {props.balances.map( balance => {
                const isPositive = balance.amount > 0;
                return(
                    <Box key={balance.participantId}
                        sx={{width:'100%', height: '36px', display: 'flex', textAlign: 'center', flexDirection: isPositive ? 'row' : 'row-reverse'}}>
                        <Box sx={{width: '50%', px: .5, my: .5, display: 'flex', justifyContent: isPositive ? 'end' : 'start'}}>
                            <Typography variant="body2" sx={{ alignSelf: 'center', fontWeight:'bold' }}>
                                {balance.participantName}
                            </Typography>
                        </Box>
                        <Box sx={{width: '50%', px: .5, my: .5, display: 'flex', justifyContent: isPositive ? 'start' : 'end'}}>
                            <Typography variant="body2" sx={{ position:'absolute', px: 1, alignSelf: 'center' }}>
                                {balance.amount}&nbsp;{props.party.currency}
                            </Typography>
                            <Box sx={{ zIndex: -10, width:`${(Math.abs(balance.amount) / maxBalance) * 100}%`, 
                                backgroundColor: isPositive ? 'rgba(100, 255, 100, 0.4)' : 'rgba(255, 100, 100, 0.4)' }} />
                        </Box>
                    </Box>
                )
            })}
        </Box>
    )
}

function ReimbursementList(props: {reimbursements: ReimburseEntry[] ,party: PartyInfo}) {

    return (
        <>
        {props.reimbursements.map(reimbursement => 
            <Paper elevation={0} sx={{ mb: 1 }} key={reimbursement.fromId + reimbursement.toId}>
                <Stack direction='row' sx={{ m: 1, p: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" >
                            {reimbursement.fromName}
                            <Typography variant="subtitle1" component="span"> owes </Typography> 
                            {reimbursement.toName}
                        </Typography>
                        <MarkLink to={`/groups/${props.party.id}/expenses/create?title=Reimbursement&amount=${reimbursement.amount}&lenderId=${reimbursement.fromId}&borrowerId=${reimbursement.toId}&isReimbursement=1`}>
                            Mark as paid
                        </MarkLink>
                    </Box>
                    <Typography variant="h6" sx={{ml: 'auto', my: 'auto'}}>
                        {reimbursement.amount}&nbsp;<Fade>{props.party.currency}</Fade>
                    </Typography>
                </Stack>
            </Paper>
        )}
        </>
    )
}

const CreateLink = styled(Link)(({theme})=>({
    "&:visited, &:link": {
        color: theme.palette.secondary.main,
    }
}))

const EmptyReimbursements = (props: {party: PartyInfo}) => {
    return (
        <Typography variant="body1" sx={{ mt: 4 }}>
            <Fade sx={{ mt: 4 }}>
                It seems you are all set! <br/> 
                Or, you haven't logged any expenses yet. If it comes up, you can add a&nbsp; 
                <CreateLink to={`/group/${props.party.id}/expenses/create`} >
                    new expense
                </CreateLink>. 
            </Fade>
        </Typography>
    )
}