import { SvgPathWrapper } from "./SvgPathWrapper";

export function SunIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <SvgPathWrapper iconProps={props} className="w-[16px] h-[16px] stroke-[1.5px]">
            <path d="M12 5V3m0 18v-2M7 7 5.7 5.7m12.8 12.8L17 17M5 12H3m18 0h-2M7 17l-1.4 1.4M18.4 5.6 17 7.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
        </SvgPathWrapper>
    )
}