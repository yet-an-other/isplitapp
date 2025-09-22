import { SvgPathWrapper } from "./SvgPathWrapper";

export function CloseIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props}>
            <path d="M6 18 17.94 6M18 18 6.06 6"/>
        </SvgPathWrapper>
    )
}

