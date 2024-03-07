import { twMerge } from "tailwind-merge";

export function SettingsIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <svg {...props}
        className={twMerge('w-6 h-6 stroke-2', props.className)}
        aria-hidden="true" 
        fill="none" 
        viewBox="0 0 24 24"
        height="1em"
    >
        <path 
            stroke="currentColor" 
            strokeLinecap="square" 
            strokeLinejoin="round" 
            d="M10 19H5a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h2m10 1a3 3 0 0 1-3 3m3-3a3 3 0 0 0-3-3m3 3h1m-4 3a3 3 0 0 1-3-3m3 3v1m-3-4a3 3 0 0 1 3-3m-3 3h-1m4-3v-1m-2.1 1.9-.7-.7m5.6 5.6-.7-.7m-4.2 0-.7.7m5.6-5.6-.7.7M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
    </svg>
    )
}