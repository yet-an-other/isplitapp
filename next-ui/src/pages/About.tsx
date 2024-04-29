import { Button, Card, CardBody, CardHeader, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";
import { ReactElement } from "react";
import { ThumbsUp } from "../icons/ThumbsUp";
import { AppleIcon, MobileIcon, PlusIcon, ShareIcon, UnevenBarsIcon } from "../icons";
import { BlockIcon } from "../icons/BlockIcon";

class FeatureItem {
    icon?: ReactElement;
    title = "";
    short? = "";
    setIsOpen?: (value: boolean | undefined) => void;
    content?: ReactElement;
}

const features: FeatureItem[] = [
    {
        icon: <ThumbsUp className="w-[32px] h-[32px] text-primary"  />,
        title: "Get right to it",
        short: "Simply input expenses and participants, and you're good to go!...",

        content: 
            <div className="text-sm text-dimmed">
                Simply input expenses and participants, and you`re good to go!
                <br/>
                No need for registration, app downloads, or SMS hassle.
                <div className="items-center my-2 w-full font-bold">Simple as 1. 2. 3.</div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="solid" color="primary" radius="full" size="sm" 
                        className="m-2"
                    >
                            <PlusIcon/>
                    </Button> 
                    Create a group with participants
                </div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="solid" color="primary" radius="full" size="sm" 
                        className="m-2"
                    >
                        <PlusIcon/>
                    </Button>  
                    Add expenses
                </div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="flat" color="primary" size="sm" 
                        className="m-2"
                    >
                            <ShareIcon/>
                    </Button> 
                    Share the link with your friends
                </div>
            </div>
    },
    {
        icon: <BlockIcon className="w-[32px] h-[32px] text-primary" />,
        title: "No ads",
        short: "No annoying ads to divert your focus from what matters most...",
        content: <div className="text-sm text-dimmed">No annoying ads to divert your focus from what matters most.</div>

    },
    {
        icon: <UnevenBarsIcon className="w-[32px] h-[32px] text-primary" />,
        title: "Visual Balances",
        short: "Visualizing who owes whom and how much...",
        content: 
            <div className="text-sm text-dimmed">
                - Visualise who owes whom and how much. 
                <br/>
                - Provides reimbursement suggestions.
                <br/> 
                - Shows outstanding balanses, total transactions and total spending in the group at one glance.
            </div>
    },
    {
        icon: <AppleIcon className="w-[32px] h-[32px] text-primary" />,
        title: "iOS Application",
        short: "With a native iOS app links will be opened in the app directly...",
        content: 
            <div className="text-sm text-dimmed">
                With a native iOS app links will be opened in the app directly, and get notifications for new expenses.
                <br/>
                <Link href="https://apps.apple.com/at/app/isplitapp/id6479542533" target="_blank" className="text-primary">Download the app</Link> 
            </div>
    },
    {
        icon: <ShareIcon className="w-[32px] h-[32px] text-primary" />,
        title: "Easy sharing",
        short: "Just send the link to your friends and they will join the group with one click...",
        content: 
            <div className="text-sm text-dimmed">
                Just send the link to your friends and they will join the group with one click.
                <br/>
                No need for registration, app downloads, or SMS hassle.
            </div>

    },
    {
        icon: <MobileIcon className="w-[32px] h-[32px] text-primary" />,
        title: "Power WebApp",
        short: "You can install iSplit.app on your device and use it as a native application...",
        content: 
            <div className="text-sm text-dimmed">
                You can install iSplit.app on your device and use it as a native application, including notifications for new expenses and open links in the app.
                <br/>
                <div className="flex flex-row items-center m-1">
                    - open the applicaion url (https://isplit.app) in the browser
                </div>
                <div className="flex flex-row items-center m-1">
                    - click on share button <ShareIcon className="w-5 h-5 text-dimmed mx-1 border-1 rounded-sm" />
                </div>
                <div className="flex flex-row items-center m-1">
                    - click on &ldquo;Add to Home Screen&rdquo; <PlusIcon className="w-5 h-5 text-dimmed mx-1 border-1 rounded-sm" />
                </div>
            </div>

    },

];

export function About() {

    return (
        <>
            <h1 className="text-4xl font-bold mt-24">Share Expenses</h1>
            <h5 className="text-xl text-dimmed mt-2">Intuitive, Clean and Free. Ads Free.</h5>
            <Button 
                color="primary" 
                className="mt-20" 
                variant="solid"
                as={Link}
                href="/create"
            >
                Create Group
            </Button>

            <h5 className="text-xl font-bold mt-20">Motivation</h5>

            <div className="flex text-sm text-dimmed p-5 text-justify">
                The SplitWise app has been a long-standing tool for managing shared expenses, but its recent shift towards a cumbersome UI, an increase in advertisements, and the gating of essential features behind a subscription paywall has lessened its appeal.
                <br/>
                Here is a yet another application that offers a free, straightforward, and intuitive way for managing shared costs. 
            </div>

            <h5 className="text-xl font-bold my-5">Features</h5>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-5">
                { features.map((feature, index) => 
                    <>
                        <Card 
                            key={index}
                            className={`max-w-[170px] h-[170px]`} 
                            isPressable
                            onPress={() => feature.setIsOpen && feature.setIsOpen(true)}
                        >
                            <CardHeader className="flex py-2 gap-2">
                                {feature.icon}
                                <div  className="text-sm font-bold mb-2 pt-3">{feature.title}</div>
                            </CardHeader>
                            <CardBody className="pt-0 overflow-clip">
                                
                                <p className="text-sm text-dimmed">
                                    {feature.short}
                                </p>
                            </CardBody>
                        </Card>
                        <FullDescription feature={feature}/>
                    </>
                )}
            </div>

            <h5 className="text-xl font-bold mt-[40px]">At glance</h5>

            <img src="/isa-guide.png" alt="overview" className="w-full p-2" />

            <CreateGroupMenu />
        </>
    )
}


const FullDescription = ({feature}: {feature: FeatureItem}) => {

    const {isOpen, onOpen, onClose} = useDisclosure();
    feature.setIsOpen = onOpen;
    return (
        <Modal 
            size="xs" 
            isOpen={isOpen} 
            onClose={onClose}
            placement="center"
            backdrop="blur"
            disableAnimation
            >
            <ModalContent>
                <ModalHeader className="flex flex-col">
                    <div className="flex flex-row gap-2 items-center">
                        {feature.icon}
                        <div className="text-xl font-bold">{feature.title}</div>
                    </div>
                </ModalHeader>
                <ModalBody>
                    {feature.content}
                </ModalBody>
                <ModalFooter>

                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}