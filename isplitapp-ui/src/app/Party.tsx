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

export default function Party() {

    const { partyId } = useParams();
    const errorAlert  = useErrorAlert();

    let [party, setParty] = useState<PartyInfo>(new PartyInfo())

    useEffect(() => {
        if (!partyId)
            return;

        fetchParty(partyId)
        .then(p => setParty(p))
        .catch(e => {
            console.log(e);
            errorAlert("Something went wrong. Unable to fetch data from server, please try again later.");
        })

    }, [partyId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Container>
            
            <PartyMenuBar partyId={partyId!} />

            <PartyCard party={party} ActionIcon={ShareButton} />

            <Outlet context={party} />

        </Container>
    )
}

const ShareButton = ({partyId, sx}: ActionIconProps) => {
    const successAlert = useSuccessAlert();

    const handleShare = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (await shareLink(`${window.location.origin}/groups/${partyId}/expenses`))
            successAlert("The link has been successfully copied")

        event.stopPropagation();
    }

    return(
        <IconButton sx={sx} onClick={handleShare}>
            <IosShare/>
        </IconButton>
    )
}
