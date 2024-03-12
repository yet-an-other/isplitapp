import { SvgPathWrapper } from "./SvgPathWrapper";

export function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <SvgPathWrapper iconProps={props}>
            <path d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
        </SvgPathWrapper>
    )
}