import { IconProps } from "./IconProps";

export function MenuIcon({className}: IconProps){
    return (
    <svg className={`h-[24px] w-[24px] ${className}`} aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14"/>
    </svg>
    )
}