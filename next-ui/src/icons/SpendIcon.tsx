import { twMerge } from "tailwind-merge";

export function SpendIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <svg {...props}
        className={twMerge('w-6 h-6 stroke-2', props.className)}
        aria-hidden="true" 
        fill="none" 
        viewBox="0 0 24 24"
        height="1em"
    >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M20 12H8m12 0-4 4m4-4-4-4M9 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2"/>
    </svg>
    )
}