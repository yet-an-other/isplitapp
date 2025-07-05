import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { ParticipantInfo } from "../api/contract/ParticipantInfo";
import { PartyInfo } from "../api/contract/PartyInfo";
import { fetcher } from "../api/expenseApi";

/**
 * Generate a CSV report for a party
 * @param partyId 
 */
export async function generateReport(partyId: string) {
    const csvDelimiter = ';';
    const party = await fetcher<PartyInfo>(`/parties/${partyId}`);
    const expenses = await fetcher<ExpenseInfo[]>(`/parties/${party.id}/expenses`);

    const particiapntAmount = (participant: ParticipantInfo, expense: ExpenseInfo) => {
        const paidAmount = participant.id === expense.lenderId ? expense.amount : 0;
        return (((paidAmount * 100) - (expense.borrowers.filter(b => b.participantId === participant.id)[0]?.amount || 0) * 100) / 100)
            .toFixed(2);
    }

    const csvHeader = `Title${csvDelimiter} Date${csvDelimiter} Amount${party.participants.map(p => `${csvDelimiter} "${p.name}"`).join('')}\n`;
    const csvReport = expenses.map(e  => {
        const participants = party.participants.map(p => particiapntAmount(p, e));
        return `"${e.title}"${csvDelimiter} ${new Date(e.date).toDateString()}${csvDelimiter} ${e.amount}${csvDelimiter} ${participants.join(`${csvDelimiter} `)}\n`;
    })

    const csvContent = `data:text/csv;charset=utf-8, ${csvHeader}${csvReport.join('')}`;

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${party.name} report.csv`;
    link.click();
}