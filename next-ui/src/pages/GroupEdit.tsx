import { Button, Card, CardBody, CardFooter, CardHeader, Input } from "@nextui-org/react";
import { UserIcon, TrashIcon, UserPlusIcon } from "../icons";
import { PartyPayload, PartyPayloadSchema } from "../api/contract/PartyPayload";
import { useState } from "react";
import { ZodError, z } from "zod";
import { createParty } from "../api/expenseApi";


export function GroupEdit() {

    const initParty = new PartyPayload();
    initParty.participants = [{name: "Alice", id: "", canDelete: true}, {name: "Bob", id: "", canDelete: true}]
    const [party, setParty] = useState<PartyPayload>(initParty);

    const [validationResult, setValidationResult] = useState<{ success: true; data: z.infer<typeof PartyPayloadSchema> } | { success: false; error: ZodError; }>();
    const [isShowErrors, setIsShowErrors] = useState(false);
    const [isParticipantFocus, setParticipantFocus] = useState(false);


    const handleGroupChange = (event: {name: string, value: string}) => {
        const { name, value } = event;

        const newParty = {...party, [name]: value, participants:[...party.participants]};
        setParty(newParty);
        setValidationResult(PartyPayloadSchema.safeParse(newParty));
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
            await createParty(party);
        }
    }

    const fieldError = (fieldName: string) => {
        if (!validationResult || validationResult.success || !isShowErrors) {
            return "";
        }
        return validationResult.error.issues
        .find(i => i.path.join(".") === fieldName)?.message ?? "";
    }

    return (
        <div className="w-full flex flex-col">
            <Card shadow="sm" className="mx-6">
                <CardHeader className="flex flex-col items-start">
                    <h1 className="text-2xl">Group</h1>
                    <div className="text-xs text-dimmed">Get started now by creating a group of participants to share expenses with</div>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            isRequired
                            autoFocus
                            type="text" 
                            label="Group Name" 
                            size="sm"
                            description="Like 'Trip to Paris' or 'Sailing in the Croatia'"
                            value={party.name}
                            onChange={(e) => handleGroupChange({name: "name", value: e.target.value})}
                            isInvalid={!!fieldError("name")}
                            errorMessage={fieldError("name")}
                            classNames={{
                                label: "text-dimmed",
                                description: "text-dimmed"
                            }}
                        />
                        <Input 
                            isRequired 
                            type="text" 
                            label="Currency" 
                            size="sm"
                            description="Will be used for all expenses in this group"
                            value={party.currency}
                            onChange={(e) => handleGroupChange({name: "currency", value: e.target.value})}
                            isInvalid={!!fieldError("currency")}
                            errorMessage={fieldError("currency")}
                            classNames={{
                                label: "text-dimmed",
                                description: "text-dimmed"
                            }}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card shadow="sm" className="mx-6 mt-4">
                <CardHeader className="flex flex-col items-start">
                    <h1 className="text-2xl">Participants</h1>
                    <div className="text-xs text-dimmed">Add participants who will be sharing expenses in this group</div>
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
                            label="Name" 
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
                            }}
                        />
                        <Button 
                            onClick={() => handleDeleteParticipant(i)}
                            disabled={!p.canDelete}
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
                        onClick={handleAddParticipant} 
                    >
                        <UserPlusIcon className="h-8 w-8 text-primary" />
                    </Button>
                </CardFooter>
            </Card>

            <Button className="mx-6 mt-8 self-end" size="lg" variant="solid" color="primary" onPress={() => {void handleSave()}}>Create Group</Button>
        </div>
    )
}