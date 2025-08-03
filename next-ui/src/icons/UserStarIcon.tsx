import { SvgPathWrapper } from "./SvgPathWrapper";

export function UserStarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <SvgPathWrapper iconProps={props}>
            <path d="M 13 15 L 17 18 L 23 10 C 23 9 22 8 21 9 L 18 14 L 18 14 C 17 16 16 15 16 15 L 15 14 C 13 12 13 15 13 15 Z Z Z M 5 8 a 4 4 0 1 1 7.938 0.703 a 7.029 7.029 0 0 0 -3.235 3.235 A 4 4 0 0 1 5 8 Z m 4.29 5 H 7 a 4 4 0 0 0 -4 4 v 1 a 2 2 0 0 0 2 2 h 6.101 A 6.979 6.979 0 0 1 9 15 c 0 -0.695 0.101 -1.366 0.29 -2 Z"/>
    </SvgPathWrapper>
  )
}

