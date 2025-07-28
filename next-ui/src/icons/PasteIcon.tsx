import { SvgPathWrapper } from "./SvgPathWrapper";

export function PasteIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <SvgPathWrapper iconProps={props}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
    </SvgPathWrapper>
    )
}