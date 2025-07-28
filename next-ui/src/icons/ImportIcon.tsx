import { SvgPathWrapper } from "./SvgPathWrapper";

export function ImportIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <SvgPathWrapper iconProps={props}>
        <path d="M12 3v9"/>
        <path d="m15 9-3 3-3-3"/>
        <path d="M3 17h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2z"/>
        <path d="M8 17v2M16 17v2"/>
    </SvgPathWrapper>
    )
}