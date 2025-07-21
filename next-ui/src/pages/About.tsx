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
                <div>
                    • {t('about.features.visualBalances.description.charts')}
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-center my-4">
                    <img src="/guide-balance-light.png" alt={t('about.altText')} className="w-full dark:hidden" />
                    <img src="/guide-balance-dark.png" alt={t('about.altText')} className="w-full hidden dark:block" />
                </div>
                <div>
                    • {t('about.features.visualBalances.description.suggestions')}
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-center my-4">
                    <img src="/guide-reimburse-light.png" alt={t('about.altText')} className="w-full dark:hidden" />
                    <img src="/guide-reimburse-dark.png" alt={t('about.altText')} className="w-full hidden dark:block" />
                </div>        
                <div>
                    • {t('about.features.visualBalances.description.summaries')}
                </div>                        
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
            <div className="text-center">
                <h1 className="text-4xl font-bold mt-[60px]">
                    {t('about.titleParts.share')} <span className="text-primary">{t('about.titleParts.expenses')}</span> <br/> {t('about.titleParts.effortlessly')}
                </h1>
                <h5 className="text-l text-dimmed mt-1">{t('about.subtitle')}</h5>
            </div>
            <Button
                size="lg" 
                color="primary" 
                className="mt-[100px] mb-[120px]" 
                variant="solid"
                as={Link}
                href="/create"
            >
                {t('about.createGroupButton')}
            </Button>

            <div 
                className="text-center bg-gray-50 dark:bg-zinc-900 py-[100px]" 
                style={{marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw'}}>

                <div className="max-w-5xl mx-auto px-5">
                    <h5 className="text-xl font-bold">{t('about.motivationTitle')}</h5>

                    <div className="flex text-sm text-dimmed p-5 text-justify">
                        <div dangerouslySetInnerHTML={{ __html: t('about.motivationText') }} />
                    </div>

                    <h5 className="text-xl font-bold my-5 mt-[20px]">{t('about.featuresTitle')}</h5>

                    <div className="flex flex-wrap gap-4 justify-center mt-5 max-w-[720px] mx-auto">
                        { features.map((feature, index) => 
                            <div key={index}>
                                <Card 
                                    className={`max-w-[170px] h-[170px]`} 
                                    isPressable
                                    onPress={() => feature.setIsOpen && feature.setIsOpen(true)}
                                >
                                    <CardHeader className="flex py-2 gap-2">
                                        {feature.icon}
                                        <div  className="text-sm font-bold mb-2 pt-3 pl-2 text-left">
                                            {t(feature.titleKey)}
                                        </div>
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
                </div>
            </div>

            <h5 className="text-xl font-bold mt-[70px]">{t('about.atGlanceTitle')}</h5>

            <div className="flex flex-wrap gap-6 items-center justify-center mt-5">
                <img src="/guide-group-light.png" alt={t('about.altText')} width={300} className="dark:hidden" />
                <img src="/guide-group-dark.png" alt={t('about.altText')} width={300} className="hidden dark:block" />
                <img src="/guide-balance-light.png" width={300} className="dark:hidden" />
                <img src="/guide-balance-dark.png" width={300} className="hidden dark:block" />
            </div>

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
                        <div className="text-xl font-bold w-full text-center mr-7 dark:text-gray-200">{t(feature.titleKey)}</div>
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