import { GithubIcon, LogoIcon } from "../icons";
import { useTranslation } from "react-i18next";

const version = import.meta.env.VITE_VERSION as string;
const isDev = import.meta.env.DEV;

export function FooterBar() {
    const { t } = useTranslation();
    return (
        <div className={`h-24 flex flex-col items-center justify-end w-full bg-gray-50  dark:bg-zinc-900`}>
            <div className="flex flex-row mb-6">
                <div className="flex flex-row items-end">
                    <LogoIcon className="h-[18px] w-[18px] stroke-none ml-3 mr-1" />
                    <div className="text-xs text-dimmed">
                        {t('footerBar.appName')}
                    </div>
                </div>
                <a href="https://github.com/yet-an-other/isplitapp">
                    <div className="flex flex-row items-end">
                        <GithubIcon className="h-[18px] w-[18px] ml-3 mr-1 mt-2" />
                        <span className="text-xs text-dimmed">v{version}{isDev && '-dev'}</span> 
                    </div>
                </a>
            </div>
        </div>
    )
}