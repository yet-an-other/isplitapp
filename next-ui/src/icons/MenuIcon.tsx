import { SvgPathWrapper } from "./SvgPathWrapper";

export function MenuIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <SvgPathWrapper iconProps={props}>
        <path d="M5 7h14M5 12h14M5 17h14"/>
    </SvgPathWrapper>
    )
}