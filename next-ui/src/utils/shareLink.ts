/**
 * Copy to clipboard and share url to a group
 * @param partyId unique id of the group 
 */
export async function shareLink(partyId: string) {

    const shareData = {
        text: 'iSplit.app link to an expense group',
        url: `${window.location.origin}/${partyId}/expenses`
    }
    let isSuccess = false;

    try{
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareData.url)
            isSuccess = true;
        }

        if (navigator.share !== undefined && navigator.canShare(shareData)){
            await navigator.share(shareData)
            isSuccess = true;
        }
    }
    catch(e)
    {
        console.warn(`Can't share url: ${(e as Error).message}`);
    }

    return isSuccess;
}