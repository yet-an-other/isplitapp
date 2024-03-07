import { twMerge } from 'tailwind-merge'

export function PlusIcon(props: React.SVGProps<SVGSVGElement>){
    return (
        <svg {...props}
            className={twMerge('w-6 h-6 stroke-2', props.className)}
            aria-hidden="true" 
            fill="none" 
            viewBox="0 0 24 24"
            height="1em"
        >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7 7V5"/>    
        </svg>
    )
}