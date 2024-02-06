import Button from "@mui/material/Button/Button";
import Grid from "@mui/material/Grid/Grid";
import Typography from "@mui/material/Typography/Typography";
import { useMatch, useNavigate } from "react-router-dom";


export default function PartyMenuBar(props: { partyId: string | undefined }) {
    const navigate = useNavigate();
    const matchExpenses = useMatch(`/groups/:partyId/expenses`);
    const matchBalance = useMatch(`/groups/:partyId/balance`);
    const matchEdit = useMatch(`/groups/:partyId/edit`);

    return (
        <Grid container>
        <Grid item xs={3}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', my: 2 }}>
                Group
            </Typography>
        </Grid>
        <Grid item xs={9} sx={{ display:"flex", alignItems: "center", justifyContent: 'end' }}>
            {props.partyId 
            ?
                <>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ m: '2px' }}
                        disabled = { matchExpenses ? true : false } 
                        onClick={() => navigate(`/groups/${props.partyId}/expenses`)}>
                            Expenses
                    </Button>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        sx={{ m: '2px' }}
                        disabled = { matchBalance ? true : false } 
                        onClick={() => navigate(`/groups/${props.partyId}/balance`)}>
                            Balance
                    </Button>
                    <Button 
                        size="small" 
                        variant="outlined"
                        sx={{ m: '2px' }} 
                        disabled = { matchEdit ? true : false }
                        onClick={() => navigate(`/groups/${props.partyId}/edit`)}>
                            Edit
                    </Button>
                </>
            :
                ''
            }
        </Grid>
    </Grid>
    )
}