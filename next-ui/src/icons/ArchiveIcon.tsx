import { SvgPathWrapper } from './SvgPathWrapper'

export function ArchiveIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props}>
            <path d="M12 11v5m0 0 2-2m-2 2-2-2M3 6v1c0 .6.4 1 1 1h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1Zm2 2v10c0 .6.4 1 1 1h12c.6 0 1-.4 1-1V8H5Z"/>
        </SvgPathWrapper>
    )
}