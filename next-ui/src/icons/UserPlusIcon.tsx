import { SvgPathWrapper } from "./SvgPathWrapper";

export function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
        <path d="M16 12h4m-2 2v-4M4 18v-1a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1c0 .6-.4 1-1 1H5a1 1 0 0 1-1-1Zm8-10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
    </SvgPathWrapper>
  )
}