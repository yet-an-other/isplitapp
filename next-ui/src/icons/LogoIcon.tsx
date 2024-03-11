
import { SvgPathWrapper } from './SvgPathWrapper'

export function LogoIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <SvgPathWrapper iconProps={props} className='stroke-0 fill-[#292D32] dark:fill-zinc-400' >
        <path opacity="0.4" d="M12 10V22H7.81C4.17 22 2 19.83 2 16.19V10H12Z" />
        <path d="M22 7.81V10H2V7.81C2 4.17 4.17 2 7.81 2H16.19C19.83 2 22 4.17 22 7.81Z" />
        <path opacity="0.6" d="M22 10V16.19C22 19.83 19.83 22 16.19 22H12V10H22Z" />
    </SvgPathWrapper>
    )
}
