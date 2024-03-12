import { SvgPathWrapper } from "./SvgPathWrapper";

export function MoonIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props} className="w-[16px] h-[16px] stroke-[1.5px]">
            <path d="M12 21a9 9 0 0 1-.5-18v0A9 9 0 0 0 20 15h.5a9 9 0 0 1-8.5 6Z"/>
        </SvgPathWrapper>
    )
}