import { SvgPathWrapper } from "./SvgPathWrapper";

export function UnevenBarsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
        <path d="M5 7h14M5 12h14M5 17h10"/>
    </SvgPathWrapper>
  )
}