import { SvgPathWrapper } from "./SvgPathWrapper";

export function ReimbursementIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <SvgPathWrapper iconProps={props}>
        <path d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
    </SvgPathWrapper>
    )
}
