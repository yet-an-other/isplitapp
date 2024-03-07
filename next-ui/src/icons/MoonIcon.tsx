import { IconProps } from "./IconProps";

export function MoonIcon({className}: IconProps){
    return (
        <svg className={`w-[16px] h-[16px] ${className}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 21a9 9 0 0 1-.5-18v0A9 9 0 0 0 20 15h.5a9 9 0 0 1-8.5 6Z"/>
        </svg>
    )
}