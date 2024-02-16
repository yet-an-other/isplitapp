/**
 * Copy to clipboard and share url to a group or anything else
 * @param url 
 */
export async function shareLink(url: string) {

    const shareData = {
        text: 'iSplit.app link to an expense group',
        url: url
    }
    let isSuccess = false;

    try{
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(url)
            isSuccess = true;
        }

        if (navigator.share !== undefined && navigator.canShare(shareData)){
            await navigator.share(shareData)
            isSuccess = true;
        }
    }
    catch(e)
    {
        console.log("Can't share url: " + e);
    }

    return isSuccess;
}