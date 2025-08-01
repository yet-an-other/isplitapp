import { Button, Checkbox, CheckboxGroup, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@heroui/react";
import { useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { PartyInfo } from "../api/contract/PartyInfo";
import { SplitMode } from "../api/contract/SplitMode";
import { ExpensePayload, ExpensePayloadSchema } from "../api/contract/ExpensePayload";
import { useMemo, useState, useEffect } from "react";
import { ParticipantInfo } from "../api/contract/ParticipantInfo";
import { NumericFormat } from "react-number-format";
import { ZodError, z } from "zod";
import { createExpense, deleteExpense, fetcher, updateExpense } from "../api/expenseApi";
import { mutate } from "swr";
import { ExpenseInfo } from "../api/contract/ExpenseInfo";
import { ProblemError } from "../api/contract/ProblemError";
import useSWR from "swr";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { useAlerts } from "../utils/useAlerts";
import { useTranslation } from "react-i18next";
import { usePartySetting } from "../utils/partySetting";


function useQueryParams() {
    const [searchParams] = useSearchParams();
    const params = {} as Record<string, string>;
    searchParams.forEach((v,k) =>  {
        params[k] = v 
    })
    
    return params
}

export function ExpenseEdit() {

    const group = useOutletContext<PartyInfo>();
    const { expenseId } = useParams();
    const partySettings = usePartySetting(group.id);

    const { title, lenderId, borrowerId, amount, isReimbursement } = useQueryParams();
    
    // Use default participant from party settings if available, otherwise use first participant
    const defaultLenderId = lenderId ?? 
        (partySettings.defaultParticipantId && group.participants.find(p => p.id === partySettings.defaultParticipantId)?.id) ?? 
        group.participants[0].id;
    
    const paramsExpense = {
        title: title ?? "",
        borrowers: borrowerId 
            ? [{participantId: borrowerId, amount: 0, share: 1, percent: 0}]
            : group.participants.map(p => {return {participantId: p.id, amount: 0, share: 1, percent: 0}}),
        lenderId: defaultLenderId,
        amount: Number.parseFloat(amount ?? "0"),
        isReimbursement: Boolean(JSON.parse(isReimbursement ?? "false")),
        date: new Date(Date.now()),
        splitMode: "Evenly" as SplitMode
    }

    const [expense, setExpense] = useState<ExpensePayload>(paramsExpense);
    const { error, isLoading } = useSWR<ExpenseInfo, ProblemError>(
        expenseId ? `/expenses/${expenseId}` : null, 
        fetcher,
        {onSuccess: (data) => { data && setExpense(data) }}
    );

    if (expenseId && error)
        return (<ErrorCard error={error} />)

    if (expenseId && isLoading)
        return (<CardSkeleton />)

    return <ExpenseEditForm group={group} expenseId={expenseId} defaultExpense={expense} />
}


function ExpenseEditForm ({ group, expenseId, defaultExpense }: {group: PartyInfo, expenseId: string | undefined, defaultExpense: ExpensePayload}) {

    const navigate = useNavigate();
    const confirm = useDisclosure();
    const alertError = useAlerts().alertError;
    const { t } = useTranslation();

    const [expense, setExpense] = useState<ExpensePayload>(defaultExpense);
    useEffect(() => setExpense(defaultExpense),[defaultExpense]);
    
    const [validationResult, setValidationResult] = 
        useState<{ success: true; data: z.infer<typeof ExpensePayloadSchema> } | { success: false; error: ZodError; }>();
    const [isShowErrors, setIsShowErrors] = useState(false);

    const handleOnChange = ({name, value}: {name: string, value: string}) => {

        let typedValue: string | boolean | string[] | Date | number = value;
        let borrowers = [...expense.borrowers];

        if (name === 'amount') {
            typedValue = (value.startsWith('0') && value.charAt(1)?.match("[1-9]"))
                ? Number.parseFloat(value.slice(1))
                : Number.parseFloat(value);
        }

        if (name === 'date') {
            typedValue = new Date(value)
        }

        if (name === 'isReimbursement') {
            typedValue = !expense.isReimbursement;
        } 

        if (name === 'borrowers') {
            borrowers = expense.borrowers.find(b => b.participantId === value) 
                ? expense.borrowers.filter(b => b.participantId !== value)
                : expense.borrowers.concat([{ participantId: value, amount: 0, share: 1, percent: 0}]);
        }

        if (name === 'splitMode') {
            borrowers = splitRecalculate(typedValue as SplitMode);
        }

        const newExpense = {...expense, [name]: typedValue, borrowers: borrowers};
        setExpense(newExpense);
        setValidationResult(ExpensePayloadSchema.safeParse(newExpense));
    }

    const handleSplitValueChange = (participantId: string, value: string) => {

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
        setValidationResult(ExpensePayloadSchema.safeParse(newExpense));
    }    

    const splitRecalculate = (mode: SplitMode) => {
         
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
        return borrowers;
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

    const fieldError = (fieldName: keyof ExpensePayload | `borrowers.${string}`) => {
        if (!validationResult || validationResult.success || !isShowErrors) {
            return "";
        }

        if (fieldName === 'borrowers') {
            return validationResult.error.issues
            .find(i => i.path.join(".").startsWith("borrowers"))?.message ?? "";
        }
        return validationResult.error.issues
        .find(i => i.path.join(".") === fieldName)?.message ?? "";
    }

    const borrowerIndex = useMemo(() => (participantId: string) => {
        return expense.borrowers.findIndex(b => b.participantId === participantId);
    }, [expense.borrowers])

    const handleSelectionToggle = (mode: "all" | "none") => {
        const newExpense = mode === 'all' 
            ? { ...expense, borrowers: group.participants.map(p => {return {participantId: p.id, amount: 0, share: 1, percent: 0}}) }
            : { ...expense, borrowers: [] }
        setExpense(newExpense);
        setValidationResult(ExpensePayloadSchema.safeParse(newExpense));
    }

    const isAllSelected = () => expense.borrowers.length === group.participants.length;
    const isNoneSelected = () => expense.borrowers.length === 0;

    const handleDeleteExpense = async (isConfirmed = false) => {
        if (!isConfirmed) {
            confirm.onOpen();
            return;
        }
        if (isConfirmed && expenseId) {
            try {
                await deleteExpense(expenseId);
                await mutate(`/parties/${group.id}`);
                navigate(`/${group.id}/expenses`);
            }
            catch {
                alertError(t('expenseEdit.errors.deleteFailed'))
            }
        }
    }

    const handleUpdateExpense = async () => {
        const result = ExpensePayloadSchema.safeParse(expense);
        setValidationResult(result);
        setIsShowErrors(true);
        if (result.success) {
            try {
                expenseId 
                    ? await updateExpense(expenseId, expense)
                    : await createExpense(group.id, expense);
                await mutate(`/parties/${group.id}`);
                navigate(`/${group.id}/expenses`);
            }
            catch(e) {
                console.error(e);
                alertError(t('expenseEdit.errors.saveFailed'))
            }
        }
    }

    return (
        <div className="mt-4">

            <Modal 
                placement="top" 
                isOpen={confirm.isOpen} 
                onOpenChange={confirm.onOpenChange} 
                size="xs" 
                backdrop="blur"
                disableAnimation
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">{t('expenseEdit.deleteModal.title')}</ModalHeader>
                    <ModalBody>
                        <p className="text-dimmed">
                            {t('expenseEdit.deleteModal.message')}
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" variant="flat" onPress={confirm.onClose}>
                            {t('common.buttons.cancel')}
                        </Button>
                        <Button color="danger" variant="flat" onPress={() => void handleDeleteExpense(true)}>
                            {t('common.buttons.delete')}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>


            <h1 className="text-2xl">{t('expenseEdit.expenseInfoSection.title')}</h1>
            <div className="text-sm text-dimmed">{t('expenseEdit.expenseInfoSection.description')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 w-full">
                <Input
                    isRequired
                    autoFocus
                    type="text" 
                    label={t('expenseEdit.fields.title.label')} 
                    size="sm"
                    description={t('expenseEdit.fields.title.description')}
                    className="sm:col-span-2"
                    classNames={{
                        label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                        description: "text-dimmed",
                        input: "text-[16px]"
                    }}
                    name="title"
                    value={expense.title}
                    onChange={e => handleOnChange(e.target)}
                    isInvalid={!!fieldError("title")}
                    errorMessage={fieldError("title")}
                />

                <NumericFormat 
                    isRequired 
                    label={t('expenseEdit.fields.amount.label')} 
                    size="sm"
                    description={t('expenseEdit.fields.amount.description')}
                    className="sm:col-span-1"
                    classNames={{
                        label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                        description: "text-dimmed",
                        input: "text-[16px]"
                    }}
                    customInput={Input}
                    thousandSeparator
                    valueIsNumericString
                    allowLeadingZeros = {false}
                    allowNegative = {false}
                    decimalScale={2}
                    value={expense.amount.toString()}
                    onValueChange={e => handleOnChange({name: 'amount', value: e.value})}
                    isInvalid={!!fieldError("amount")}
                    errorMessage={fieldError("amount")}
                />

                <Select
                    isRequired
                    label={t('expenseEdit.fields.paidBy.label')}
                    size="sm"
                    placeholder={t('expenseEdit.fields.paidBy.placeholder')}
                    description={t('expenseEdit.fields.paidBy.description')}
                    className="sm:col-span-2"
                    classNames={{
                        label: "group-data-[filled=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                        description: "text-dimmed",
                        value: "text-[16px]"
                    }}
                    selectedKeys={[expense.lenderId]}
                    onChange={e => handleOnChange({name: "lenderId", value: e.target.value})}
                    isInvalid={!!fieldError("lenderId")}
                    errorMessage={fieldError("lenderId")}
                >
                    {group.participants.map(participant =>
                        <SelectItem 
                            key={participant.id} 
                            className="dark:text-dimmed"
                        >
                            {participant.name}
                        </SelectItem>
                    )}
                </Select>
                
                <Input 
                    isRequired 
                    type="date" 
                    label={t('expenseEdit.fields.date.label')} 
                    size="sm"
                    description={t('expenseEdit.fields.date.description')}
                    className="sm:col-span-1"
                    placeholder={t('expenseEdit.fields.date.placeholder')}
                    classNames={{
                        label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                        description: "text-dimmed",
                        input: "text-[16px]"
                    }}
                    name="date"
                    value={ expense.date.toISOString().split('T')[0] }
                    onChange={e => handleOnChange({name: "date", value: e.target.value})}
                    isInvalid={!!fieldError("date")}
                    errorMessage={fieldError("date")}
                />

                <div>
                    <Checkbox
                        size="md"
                        isSelected={expense.isReimbursement}
                        onChange={() => handleOnChange({name: 'isReimbursement', value: ''})}
                    >
                        {t('expenseEdit.fields.reimbursement.label')}
                    </Checkbox>
                    <div className="text-xs text-dimmed p-1">
                        {t('expenseEdit.fields.reimbursement.description')}
                    </div>
                </div>

            </div>

            <div className="mt-6">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <h1 className="text-2xl whitespace-nowrap">{t('expenseEdit.paidForSection.title')}</h1>

                    </div>
                    <div className="flex flex-col ml-auto">
                        <Button 
                            size="sm" 
                            variant="light" 
                            color="primary" 
                            className="font-bold" 
                            isDisabled={isAllSelected()}
                            onPress={() => handleSelectionToggle('all')}
                        >
                            {t('expenseEdit.paidForSection.selectAll')}
                        </Button>
                        <Button 
                            size="sm" 
                            variant="light" 
                            color="primary" 
                            className="font-bold" 
                            isDisabled={isNoneSelected()} 
                            onPress={() => handleSelectionToggle('none')}
                        >
                            {t('expenseEdit.paidForSection.selectNone')}
                        </Button>
                    </div>
                    <Select
                        fullWidth={false}
                        size="lg"
                        label={t('expenseEdit.paidForSection.splitBy.label')}
                        selectedKeys={[expense.splitMode]}
                        onSelectionChange={keys => handleOnChange({name: 'splitMode', value:[...keys][0] as SplitMode})}
                        className="max-w-[150px] ml-2"
                        classNames={{
                            label: "group-data-[filled=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                            value: "text-[16px]"
                        }}
                    >
                        <SelectItem key="Evenly">{t('expenseEdit.paidForSection.splitBy.options.evenly')}</SelectItem>
                        <SelectItem key="ByShare">{t('expenseEdit.paidForSection.splitBy.options.share')}</SelectItem>
                        <SelectItem key="ByPercentage">{t('expenseEdit.paidForSection.splitBy.options.percentage')}</SelectItem>
                        <SelectItem key="ByAmount">{t('expenseEdit.paidForSection.splitBy.options.amount')}</SelectItem>
                    </Select> 
                </div>
                
                <CheckboxGroup
                    className="mt-4"
                    label={t('expenseEdit.paidForSection.participantsLabel')}
                    size="md"
                    classNames={{
                        label: "text-dimmed text-sm"
                    }}
                    value={expense.borrowers.map(b => b.participantId)}
                    isInvalid={!!fieldError("borrowers")}
                    errorMessage={
                        fieldError("borrowers") 
                    }
                >
                    {group.participants.map(participant =>
                        <div key={participant.id} className="flex flex-row h-8">
                            <Checkbox value={participant.id} onChange={() => handleOnChange({name: 'borrowers', value: participant.id})}>
                                {participant.name}
                            </Checkbox>
                            {expense.splitMode !== 'Evenly' && (
                                <NumericFormat
                                    isDisabled={borrowerIndex(participant.id) < 0}  
                                    size="sm"
                                    labelPlacement="outside"
                                    className={`ml-auto ${expense.splitMode === 'ByAmount' && expense.amount > 10000 ? 'max-w-[150px]': 'max-w-[100px]'}`}
                                    classNames={{
                                        input: "text-[16px]"
                                    }}
                                    endContent={
                                        <span className="text-dimmed text-sm">
                                            {expense.splitMode === 'ByPercentage' && '%'}
                                            {expense.splitMode === 'ByAmount' && group.currency}
                                        </span>}
                                    value={showSplit(participant).toString()}
                                    onValueChange={values => handleSplitValueChange(participant.id, values.value)}
                                    customInput={Input}
                                    thousandSeparator
                                    valueIsNumericString
                                    allowLeadingZeros = {false}
                                    allowNegative = {false}
                                    decimalScale={expense.splitMode === 'ByAmount' ? 2 : 0}
                                    isInvalid={
                                        !!fieldError(`borrowers.${borrowerIndex(participant.id)}.amount`) || 
                                        !!fieldError(`borrowers.${borrowerIndex(participant.id)}.share`) || 
                                        !!fieldError(`borrowers.${borrowerIndex(participant.id)}.percent`)
                                    }
                                />
                            )}
                        </div>
                    )}
                </CheckboxGroup>
            </div>

            <div className="flex mt-6">
                <Button size="sm" variant="solid" color="danger" onPress={() => void handleDeleteExpense()} isDisabled={!expenseId}>
                    {t('common.buttons.delete')}
                </Button>
                <Button size="sm" variant="solid" color="primary" className="ml-auto" onPress={() => void handleUpdateExpense()}>
                    {expenseId ? t('common.buttons.update') : t('common.buttons.add')}
                </Button>
            </div>
        </div>
    )
}
