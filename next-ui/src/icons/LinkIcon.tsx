import { twMerge } from 'tailwind-merge'

export function LinkIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <svg {...props}
        className={twMerge('w-6 h-6 stroke-2', props.className)}
        aria-hidden="true" 
        fill="none" 
        viewBox="0 0 24 24"
        height="1em"
    >
        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.2 9.8a3.4 3.4 0 0 0-4.8 0L5 13.2A3.4 3.4 0 0 0 9.8 18l.3-.3m-.3-4.5a3.4 3.4 0 0 0 4.8 0L18 9.8A3.4 3.4 0 0 0 13.2 5l-1 1"/>
    </svg>
    )
}