import { SvgPathWrapper } from './SvgPathWrapper'

export function PlusIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props}>
            <path d="M5 12h14m-7 7V5"/>    
        </SvgPathWrapper>
    )
}