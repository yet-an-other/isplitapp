import { SvgPathWrapper } from "./SvgPathWrapper";

export function BellRingIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <SvgPathWrapper iconProps={props} className="w-[16px] h-[16px] stroke-[1.5px]">
            <path d="M12 5.464V3.099m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175C19 17.4 19 18 18.462 18H5.538C5 18 5 17.4 5 16.807c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.464ZM6 5 5 4M4 9H3m15-4 1-1m1 5h1M8.54 18a3.48 3.48 0 0 0 6.92 0H8.54Z"/>
        </SvgPathWrapper>
    )
}