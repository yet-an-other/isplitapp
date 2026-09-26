# Expense Sharing

This context defines the language for recording shared expenses, allocating their costs, and settling the resulting balances.

## Language

**Party**:
An expense-sharing boundary within which Participants share Expenses and settle the resulting balances; it always contains at least one Participant. Each Participant and Expense belongs to exactly one Party, and every Payer and Expense Share of an Expense must refer to Participants in that Party.
_Avoid_: Group

**Ledger Entry**:
An Expense or Reimbursement recorded in a Party.
_Avoid_: Transaction

**Ledger Entry Count**:
The number of Expenses and Reimbursements currently recorded in a Party.
_Avoid_: Total Transactions

**Expense**:
A positive cost in the Party Currency, recorded within a Party at an Expense Timestamp, funded by one or more Payers, and allocated in full among one or more Participants through Expense Shares. Edits replace prior values and balances, while deletion removes its balance effect; neither preserves financial history.

**Party Currency**:
The label applied to every Money Amount in a Party. Changing it relabels historical and future amounts without converting their values.
_Avoid_: Expense Currency

**Money Amount**:
A value represented with exactly two decimal places and labelled with the Party Currency, regardless of that label's real-world currency conventions. Extra fractional digits are truncated rather than rounded.
_Avoid_: Micro Unit

**Expense Timestamp**:
The instant when an Expense occurred. It is distinct from the times when its record was created or last updated.
_Avoid_: Expense Date

**Expense Title**:
The required, mutable label describing what an Expense was for. An Expense has no separate description.
_Avoid_: Expense Description

**Receipt**:
Image evidence associated with exactly one Ledger Entry. It inherits the Ledger Entry's visibility and is permanently deleted with it.
_Avoid_: Attachment, Expense Attachment

**Reimbursement**:
A positive transfer in the Party Currency, recorded at the instant it occurred, from exactly one sending Participant to exactly one receiving Participant. It has no required title, is not tied to a specific Expense, and is not capped by current balances; it changes balances without counting as spending and may reverse who owes whom.
_Avoid_: Refund, compensation

**Participant**:
A Party-scoped ledger identity that can be a Payer, receive an Expense Share, or do both on the same Expense; it may be deleted only before being referenced by an Expense or Reimbursement and otherwise remains available rather than leaving or becoming inactive. The same real-world entity may have independent, unlinked Participants within or across Parties; these identities are not merged and need not represent a person, user, or device.
_Avoid_: User, member, person

**Participant Balance**:
The net Money Amount a Participant is owed within a Party: Paid Amounts minus Expense Shares, plus Reimbursements sent minus Reimbursements received. A positive balance means the Participant is owed money, a negative balance means they owe money, and zero means they are settled.

**Outstanding Balance**:
The sum of all positive Participant Balances in a Party. Because the Party ledger is zero-sum, it also equals the absolute sum of negative balances and the total Money Amount that must move to settle the Party.

**Total Expenses**:
The sum of all Expense amounts currently recorded in a Party. It excludes Reimbursements and does not depend on Payers or Expense Share allocation.

**Total Paid**:
The sum of a Participant's Paid Amounts across Expenses. It excludes Reimbursements.
_Avoid_: Participant Expenses

**Settlement Plan**:
A deterministic set of proposed Reimbursements calculated solely from Participant Balances, without preserving Expense-level relationships. Completing every proposed Reimbursement settles the Party; the plan need not minimize the number of Reimbursements.
_Avoid_: Repayment Plan

**Participant Name**:
The non-empty, mutable label used to distinguish Participants within a Party. Renaming changes how the Participant appears on historical and future Expenses and Reimbursements without changing its identity; names are trimmed of surrounding whitespace and must be unique within the Party using case-sensitive comparison.
_Avoid_: Username

**Payer**:
A Participant that funds some or all of an Expense through a Paid Amount. An Expense may have one or more Payers.
_Avoid_: Lender

**Paid Amount**:
The positive portion of an Expense funded by one Payer. Each Payer has one Paid Amount per Expense, and all Paid Amounts total the Expense amount exactly.
_Avoid_: Lender Amount

**Expense Share**:
The non-negative portion of an Expense allocated to one Participant; it may be zero when the amount cannot provide one smallest currency unit to every included Participant. An Expense has at most one Expense Share per Participant, who may also be a Payer of that Expense.
_Avoid_: Borrower

**Split Method**:
The rule used to calculate an Expense's Expense Shares. An Even Split divides equally; a Weighted Split uses positive relative weights with no fixed total; a Percentage Split uses positive percentages totaling 100%; an Amount Split uses positive amounts totaling the Expense amount.
_Avoid_: Split Mode

**Split Input**:
A positive Money Amount, whole-number percentage, or whole-number weight used to calculate a Participant's Expense Share. Zero is allowed only in the calculated Expense Share after rounding, not as an input.

**Split Remainder**:
The minor currency units left after calculating and rounding Expense Shares down. Assign them one at a time to the largest fractional remainders, breaking ties by the declared Expense Share order.
