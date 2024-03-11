import { SvgPathWrapper } from "./SvgPathWrapper";

export function TransactionsIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
    <SvgPathWrapper iconProps={props}>
        <path d="M4 16h13M4 16l4-4m-4 4 4 4M20 8H7m13 0-4 4m4-4-4-4"/>
    </SvgPathWrapper>
    )
}