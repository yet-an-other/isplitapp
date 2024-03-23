import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { ParticipantInfo } from "../api/contract/ParticipantInfo";
import { PartyInfo } from "../api/contract/PartyInfo";
import { fetcher } from "../api/expenseApi";

export async function generateReport(partyId: string) {
    const csvDelimiter = ';';
    const party = await fetcher(`/parties/${partyId}`) as PartyInfo;
    const expenses = await fetcher(`/parties/${party.id}/expenses`) as ExpenseInfo[];

    const particiapntAmount = (participant: ParticipantInfo, expense: ExpenseInfo) => {
        const paidAmount = participant.id === expense.lenderId ? expense.amount : 0;
        return (paidAmount * 100 - expense.borrowers.filter(b => b.participantId === participant.id)[0]?.amount * 100 || 0) / 100;
    }

    const csvHeader = `Title${csvDelimiter} Date${csvDelimiter} Amount${party.participants.map(p => `${csvDelimiter} "${p.name}"`).join('')}\n`;
    const csvReport = expenses.map(e  => {
        const participants = party.participants.map(p => particiapntAmount(p, e).toFixed(2));
        return `"${e.title}"${csvDelimiter} ${new Date(e.date).toDateString()}${csvDelimiter} ${e.amount}${csvDelimiter} ${participants.join(`${csvDelimiter} `)}\n`;
    })

    const csvContent = `data:text/csv;charset=utf-8, ${csvHeader}${csvReport.join('')}`;
    const encodedURI = encodeURI(csvContent);
    //window.open(encodedURI);

    const link = document.createElement("a");
    link.href = encodedURI;
    link.download = `${party.name}_report.csv`;
    link.click();
}