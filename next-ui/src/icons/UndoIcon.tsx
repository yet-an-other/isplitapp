import { SvgPathWrapper } from "./SvgPathWrapper";

export function UndoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
        <path d="M3 9h13a5 5 0 0 1 0 10H7M3 9l4-4M3 9l4 4"/>
    </SvgPathWrapper>
  )
}
