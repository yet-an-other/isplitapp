import { IosShare } from "@mui/icons-material";
import { Container, IconButton} from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { fetchParty } from "../api/expenseApi";
import { useErrorAlert, useSuccessAlert } from "../controls/AlertProvider";
import PartyMenuBar from "../controls/PartyMenuBar";
import { shareLink } from "../util";
import { ActionIconProps, PartyCard } from "../controls/PartyCard";
import { LoadingPartyContent } from "../controls/StyledControls";

export default function Party() {

    const { partyId } = useParams();
    const errorAlert  = useErrorAlert();

    let [party, setParty] = useState<PartyInfo>(new PartyInfo())
    let [isLoading, setLoading] = useState(true);

    useEffect(() => {
        if (!partyId)
            return;

        fetchParty(partyId)
        .then(p => setParty(p))
        .catch(e => {
            console.error(e);
            errorAlert("Something went wrong. Unable to fetch data from server, please try again later.");
        })
        .finally(() => setLoading(false));

    }, [partyId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Container>
            
            <PartyMenuBar partyId={partyId!} />

            <LoadingPartyContent isLoading={isLoading}>
                <PartyCard party={party} ActionIcon={ShareButton} />
            </LoadingPartyContent>

            <Outlet context={party} />

        </Container>
    )
}

const ShareButton = ({partyId, sx}: ActionIconProps) => {
    const successAlert = useSuccessAlert();

    const handleShare = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.stopPropagation();
        if (await shareLink(`${window.location.origin}/groups/${partyId}/expenses`))
            successAlert("The link has been successfully copied")
    }

    return(
        <IconButton sx={sx} onClick={handleShare}>
            <IosShare/>
        </IconButton>
    )
}
