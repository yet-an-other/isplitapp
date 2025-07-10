import { Button, Card, CardBody, CardHeader, Link, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/react";
import { CreateGroupMenu } from "../controls/CreateGroupMenu";
import { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ThumbsUp } from "../icons/ThumbsUp";
import { AppleIcon, MobileIcon, PlusIcon, ShareIcon, UnevenBarsIcon } from "../icons";
import { BlockIcon } from "../icons/BlockIcon";

class FeatureItem {
    icon?: ReactElement;
    titleKey = "";
    shortKey? = "";
    setIsOpen?: (value: boolean | undefined) => void;
    content?: (t: TFunction) => ReactElement;
}

const createFeatures = (): FeatureItem[] => [
    {
        icon: <ThumbsUp className="w-[32px] h-[32px] text-primary"  />,
        titleKey: "about.features.getStarted.title",
        shortKey: "about.features.getStarted.short",
        content: (t) => 
            <div className="text-sm text-dimmed">
                <div dangerouslySetInnerHTML={{ __html: t('about.features.getStarted.description') }} />
                <div className="items-center my-2 w-full font-bold">{t('about.features.getStarted.stepsTitle')}</div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="solid" color="primary" radius="full" size="sm" 
                        className="m-2"
                    >
                            <PlusIcon/>
                    </Button> 
                    {t('about.features.getStarted.step1')}
                </div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="solid" color="primary" radius="full" size="sm" 
                        className="m-2"
                    >
                        <PlusIcon/>
                    </Button>  
                    {t('about.features.getStarted.step2')}
                </div>
                <div className="flex flex-row items-center">
                    <Button 
                        isIconOnly variant="flat" color="primary" size="sm" 
                        className="m-2"
                    >
                            <ShareIcon/>
                    </Button> 
                    {t('about.features.getStarted.step3')}
                </div>
            </div>
    },
    {
        icon: <BlockIcon className="w-[32px] h-[32px] text-primary" />,
        titleKey: "about.features.noAds.title",
        shortKey: "about.features.noAds.short",
        content: (t) => <div className="text-sm text-dimmed">{t('about.features.noAds.description')}</div>
    },
    {
        icon: <UnevenBarsIcon className="w-[32px] h-[32px] text-primary" />,
        titleKey: "about.features.visualBalances.title",
        shortKey: "about.features.visualBalances.short",
        content: (t) => 
            <div className="text-sm text-dimmed">
                <div dangerouslySetInnerHTML={{ __html: t('about.features.visualBalances.description') }} />
            </div>
    },
    {
        icon: <AppleIcon className="w-[32px] h-[32px] text-primary" />,
        titleKey: "about.features.iosApp.title",
        shortKey: "about.features.iosApp.short",
        content: (t) => 
            <div className="text-sm text-dimmed">
                <div dangerouslySetInnerHTML={{ __html: t('about.features.iosApp.description') }} />
                <Link href="https://apps.apple.com/at/app/isplitapp/id6479542533" target="_blank" className="text-primary">
                    {t('about.features.iosApp.downloadLink')}
                </Link> 
            </div>
    },
    {
        icon: <ShareIcon className="w-[32px] h-[32px] text-primary" />,
        titleKey: "about.features.easySharing.title",
        shortKey: "about.features.easySharing.short",
        content: (t) => 
            <div className="text-sm text-dimmed">
                <div dangerouslySetInnerHTML={{ __html: t('about.features.easySharing.description') }} />
            </div>
    },
    {
        icon: <MobileIcon className="w-[32px] h-[32px] text-primary" />,
        titleKey: "about.features.powerWebApp.title",
        shortKey: "about.features.powerWebApp.short",
        content: (t) => 
            <div className="text-sm text-dimmed">
                <div dangerouslySetInnerHTML={{ __html: t('about.features.powerWebApp.description') }} />
                <div className="flex flex-row items-center m-1">
                    {t('about.features.powerWebApp.instructions.step1')}
                </div>
                <div className="flex flex-row items-center m-1">
                    {t('about.features.powerWebApp.instructions.step2')} <ShareIcon className="w-5 h-5 text-dimmed mx-1 border-1 rounded-sm" />
                </div>
                <div className="flex flex-row items-center m-1">
                    {t('about.features.powerWebApp.instructions.step3')} <PlusIcon className="w-5 h-5 text-dimmed mx-1 border-1 rounded-sm" />
                </div>
            </div>
    },
];

export function About() {
    const { t } = useTranslation();
    const features = createFeatures();

    return (
        <>
            <div className="p-5 text-center">
                <h1 className="text-4xl font-bold mt-24">
                    {t('about.titleParts.share')} <span className="text-primary">{t('about.titleParts.expenses')}</span> <br/> {t('about.titleParts.effortlessly')}
                </h1>
                <h5 className="text-l text-dimmed mt-3">{t('about.subtitle')}</h5>
            </div>
            <Button
                size="lg" 
                color="primary" 
                className="mt-15" 
                variant="solid"
                as={Link}
                href="/create"
            >
                {t('about.createGroupButton')}
            </Button>

            <h5 className="text-xl font-bold mt-20">{t('about.motivationTitle')}</h5>

            <div className="flex text-sm text-dimmed p-5 text-justify">
                <div dangerouslySetInnerHTML={{ __html: t('about.motivationText') }} />
            </div>

            <h5 className="text-xl font-bold my-5 mt-[100px]">{t('about.featuresTitle')}</h5>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mt-5">
                { features.map((feature, index) => 
                    <div key={index}>
                        <Card 
                            className={`max-w-[170px] h-[170px]`} 
                            isPressable
                            onPress={() => feature.setIsOpen && feature.setIsOpen(true)}
                        >
                            <CardHeader className="flex py-2 gap-2">
                                {feature.icon}
                                <div  className="text-sm font-bold mb-2 pt-3">{t(feature.titleKey)}</div>
                            </CardHeader>
                            <CardBody className="pt-0 overflow-clip">
                                
                                <p className="text-sm text-dimmed">
                                    {feature.shortKey && t(feature.shortKey)}
                                </p>
                            </CardBody>
                        </Card>
                        <FullDescription feature={feature} t={t}/>
                    </div>
                )}
            </div>

            <h5 className="text-xl font-bold mt-[100px]">{t('about.atGlanceTitle')}</h5>

            <img src="/isa-guide.png" alt={t('about.altText')} className="ld:w-3/4 mx-auto p-2" />

            <CreateGroupMenu />
        </>
    )
}


const FullDescription = ({feature, t}: {feature: FeatureItem, t: TFunction}) => {

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
                        <div className="text-xl font-bold">{t(feature.titleKey)}</div>
                    </div>
                </ModalHeader>
                <ModalBody>
                    {feature.content && feature.content(t)}
                </ModalBody>
                <ModalFooter>

                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}