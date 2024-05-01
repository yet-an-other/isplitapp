import { SvgPathWrapper } from "./SvgPathWrapper";

export function BlockIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props} className="w-5 h-5">
            <path d="m6 6 12 12m3-6a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </SvgPathWrapper>
    )
}
