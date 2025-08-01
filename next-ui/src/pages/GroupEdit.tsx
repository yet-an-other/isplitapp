import { Button, Card, CardBody, CardFooter, CardHeader, Input } from "@heroui/react";
import { UserIcon, TrashIcon, UserPlusIcon } from "../icons";
import { PartyPayload, PartyPayloadSchema } from "../api/contract/PartyPayload";
import { useEffect, useState } from "react";
import { ZodError, z } from "zod";
import { createParty, fetcher, updateParty } from "../api/expenseApi";
import { useNavigate, useParams } from "react-router-dom";
import useSWR, { mutate } from "swr";
import { PartyInfo } from "../api/contract/PartyInfo";
import { ProblemError } from "../api/contract/ProblemError";
import { useAlerts } from "../utils/useAlerts";
import { ErrorCard } from "../controls/ErrorCard";
import { CardSkeleton } from "../controls/CardSkeleton";
import { useTranslation } from "react-i18next";
import { COMMON_CURRENCIES } from "../utils/currencies";

export function GroupEdit() {

    const navigate = useNavigate();
    const { groupId } = useParams();
    const { t } = useTranslation();

    const initParty = new PartyPayload();
    initParty.participants = [{name: t('groupEdit.defaultNames.0'), id: "", canDelete: true}, {name: t('groupEdit.defaultNames.1'), id: "", canDelete: true}]

    const [party, setParty] = useState<PartyPayload>(initParty);
    const { data, error, isLoading } = useSWR<PartyInfo, ProblemError>(
        groupId ? `/parties/${groupId}` : null, 
        fetcher
    );
    useEffect(() => {
        if (!!data) {
            setParty(data);
        }
    }, [data]);

    const [validationResult, setValidationResult] = useState<{ success: true; data: z.infer<typeof PartyPayloadSchema> } | { success: false; error: ZodError; }>();
    const [isShowErrors, setIsShowErrors] = useState(false);
    const [isParticipantFocus, setParticipantFocus] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [filteredCurrencies, setFilteredCurrencies] = useState(COMMON_CURRENCIES);
    const alertError = useAlerts().alertError;
    
    /**
     * Handle a change in the group's name or currency.
     * 
     * Updates the party state and validates the updated party using the PartyPayloadSchema.
     * @param {{name: string, value: string}} event - The change event to handle.
     */
    const handleGroupChange = (event: {name: string, value: string}) => {
        const { name, value } = event;

        const newParty = {...party, [name]: value, participants:[...party.participants]};
        setParty(newParty);
        setValidationResult(PartyPayloadSchema.safeParse(newParty));
    }

    const handleCurrencyInputChange = (value: string) => {
        handleGroupChange({name: "currency", value: value});
        
        // Filter currencies based on input
        if (value.trim() === "") {
            setFilteredCurrencies(COMMON_CURRENCIES);
        } else {
            const filtered = COMMON_CURRENCIES.filter(currency => 
                currency.code.toLowerCase().includes(value.toLowerCase()) ||
                currency.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredCurrencies(filtered);
        }
    }

    const handleCurrencySelect = (currencyCode: string) => {
        handleGroupChange({name: "currency", value: currencyCode});
        setIsPopoverOpen(false);
    }

    const handleAddParticipant = () => {
        const newParty = {...party, participants:[...party.participants, {id: "", name: "", canDelete: true}]};
        setParty(newParty);
        setValidationResult(PartyPayloadSchema.safeParse(newParty));
        setParticipantFocus(true);
    };

    const handleDeleteParticipant = (index: number) => {
        const newParty = {...party, participants: party.participants.filter((_, i) => i !== index)};
        setParty(newParty);
        setValidationResult(PartyPayloadSchema.safeParse(newParty));
    };
    
    const handleNameChange = (index: number, text: string) => {
        const updated = [...party.participants];
        updated[index].name = text;
        const newParty = {...party, participants: updated};
        setParty(newParty);
        setValidationResult(PartyPayloadSchema.safeParse(newParty));
    }

    const handleSave = async () => {
        const result = PartyPayloadSchema.safeParse(party);
        setValidationResult(result);
        setIsShowErrors(true);
        if (result.success) {
            try {
                groupId && await updateParty(groupId, party);
                const partyId = groupId ?? await createParty(party);
                await mutate(`/parties/${partyId}`);
                await mutate(`/parties`);
                navigate(`/${partyId}/expenses`);
            } 
            catch (error) {
                alertError(t('groupEdit.errors.saveFailed'));
                console.error(error);
            }
        }
    }

    const fieldError = (fieldName: string) => {
        if (!validationResult || validationResult.success || !isShowErrors) {
            return "";
        }
        return validationResult.error.issues
        .find(i => i.path.join(".") === fieldName)?.message ?? "";
    }

    if (error) {
        return <ErrorCard error={error} />
    }

    if (isLoading) {
        return <CardSkeleton />
    }

    return (
        <div className="w-full flex flex-col">
            <Card shadow="sm" className={`${groupId ? 'mt-6' : 'mx-6'} overflow-visible`}>
                <CardHeader className="flex flex-col items-start">
                    <h1 className="text-2xl">{t('groupEdit.groupSection.title')}</h1>
                    <div className="text-xs text-dimmed">{t('groupEdit.groupSection.description')}</div>
                </CardHeader>
                <CardBody className="overflow-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            isRequired
                            autoFocus
                            type="text" 
                            label={t('groupEdit.fields.groupName.label')} 
                            size="sm"
                            description={t('groupEdit.fields.groupName.description')}
                            value={party.name}
                            onChange={(e) => handleGroupChange({name: "name", value: e.target.value})}
                            isInvalid={!!fieldError("name")}
                            errorMessage={fieldError("name")}

                            classNames={{
                                label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                                description: "text-dimmed",
                                input: "text-[16px]"
                            }}
                        />
                        <div className="relative">
                            <Input
                                isRequired
                                type="text"
                                label={t('groupEdit.fields.currency.label')}
                                size="sm"
                                description={t('groupEdit.fields.currency.description')}
                                value={party.currency}
                                onChange={(e) => handleCurrencyInputChange(e.target.value)}
                                onFocus={() => setIsPopoverOpen(true)}
                                onBlur={() => setTimeout(() => setIsPopoverOpen(false), 100)}
                                isInvalid={!!fieldError("currency")}
                                errorMessage={fieldError("currency")}
                                classNames={{
                                    label: "group-data-[filled-within=true]:text-dimmed group-data-[filled-within=true]:-mt-1.5",
                                    description: "text-dimmed",
                                    input: "text-[16px]"
                                }}
                            />
                            {isPopoverOpen && filteredCurrencies.length > 0 && (
                                <div className="absolute z-100 w-full bg-background border border-default-200 rounded-lg shadow-large mt-1 max-h-60 overflow-y-auto" >
                                    {filteredCurrencies.map((currency) => (
                                        <div
                                            key={currency.code}
                                            className="px-3 py-2 hover:bg-default-100 cursor-pointer text-sm border-b border-default-100 last:border-b-0"
                                            onClick={() => handleCurrencySelect(currency.code)}
                                            onMouseDown={() => handleCurrencySelect(currency.code)}
                                        >
                                            {currency.code} - {currency.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card shadow="sm" className={`${groupId ? '' : 'mx-6'} mt-4`}>
                <CardHeader className="flex flex-col items-start">
                    <h1 className="text-2xl">{t('groupEdit.participantsSection.title')}</h1>
                    <div className="text-xs text-dimmed">{t('groupEdit.participantsSection.description')}</div>
                </CardHeader>
                <CardBody>
                    <div className={`text-xs text-danger ${!fieldError("participants") ? 'hidden': 'block'}`}>
                        {fieldError("participants")}
                    </div>
                    {party.participants.map((p, i) => 
                    <div className="flex flex-row mb-2" key={p.id + i}>
                        <Input
                            isRequired
                            autoFocus={isParticipantFocus}
                            className="mb-1"
                            type="text" 
                            label={t('groupEdit.fields.participantName.label')} 
                            size="sm"
                            labelPlacement="outside"
                            startContent={
                                <UserIcon className="w-6 h-6 text-2xl text-default-400 pointer-events-none flex-shrink-0" />
                            }
                            onChange={(e) => handleNameChange(i, e.target.value)}
                            value={p.name}
                            isInvalid={!!fieldError(`participants.${i}.name`)}
                            errorMessage={fieldError(`participants.${i}.name`)}
                            classNames={{
                                label: "text-dimmed",
                                description: "text-dimmed",
                                input: "text-[16px]"
                            }}
                        />
                        <Button 
                            onPress={() => handleDeleteParticipant(i)}
                            isDisabled={!p.canDelete}
                            isIconOnly variant="light" className={`self-end ml-2 ${!!fieldError(`participants.${i}.name`) && 'mb-6' }`}>
                            <TrashIcon className="h-6 w-6 text-danger"/>
                        </Button>
                    </div>
                    )}
                </CardBody>
                <CardFooter>
                    <Button 
                        isIconOnly
                        variant="light"
                        onPress={handleAddParticipant} 
                    >
                        <UserPlusIcon className="h-8 w-8 text-primary" />
                    </Button>
                </CardFooter>
            </Card>

            <Button 
                className="mx-6 mt-8 self-end" 
                size="md" 
                variant="solid" 
                color="primary" 
                onPress={() => void handleSave()}
            >
{groupId ? t('groupEdit.buttons.updateGroup') : t('groupEdit.buttons.createGroup')}
            </Button>
        </div>
    )
}