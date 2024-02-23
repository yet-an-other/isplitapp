import { IconProps } from "./IconProps";

export function PlusIcon({className}: IconProps){
    return (
    <svg className={className} aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5"/>
    </svg>
    )
}