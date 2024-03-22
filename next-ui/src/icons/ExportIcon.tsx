import { SvgPathWrapper } from './SvgPathWrapper'

export function ExportIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props}>
            <path d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4"/>
        </SvgPathWrapper>
    )
}