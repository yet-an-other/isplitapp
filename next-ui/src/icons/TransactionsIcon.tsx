import { IconProps } from "./IconProps";

export function TransactionsIcon({ className }: IconProps) {
    return (
    <svg className={ className } aria-hidden="true" fill="none" viewBox="0 0 24 24">
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16h13M4 16l4-4m-4 4 4 4M20 8H7m13 0-4 4m4-4-4-4"/>
    </svg>
    )
}