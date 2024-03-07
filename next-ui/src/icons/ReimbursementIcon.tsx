import { twMerge } from "tailwind-merge";

export function ReimbursementIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <svg {...props} 
    className={twMerge('w-6 h-6 stroke-2', props.className)}
        aria-hidden="true" 
        fill="none" 
        viewBox="0 0 24 24"
        height="1em"
    >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M16 12H4m12 0-4 4m4-4-4-4m3-4h2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-2"/>
    </svg>
    )
}
