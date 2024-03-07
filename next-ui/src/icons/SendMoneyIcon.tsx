import { twMerge } from 'tailwind-merge'

export function SendMoneyIcon(props: React.SVGProps<SVGSVGElement>){
    return (
    <svg {...props}
        className={twMerge('w-6 h-6 stroke-2', props.className)}
        aria-hidden="true" 
        fill="none" 
        viewBox="-0.5 0 25 25"
        stroke="currentColor"
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M18 10.9199V2.91992" />
        <path d="M14.8008 6.11992L18.0008 2.91992L21.2008 6.11992" />
        <path d="M10.58 3.96997H6C4.93913 3.96997 3.92178 4.39146 3.17163 5.1416C2.42149 5.89175 2 6.9091 2 7.96997V17.97C2 19.0308 2.42149 20.0482 3.17163 20.7983C3.92178 21.5485 4.93913 21.97 6 21.97H18C19.0609 21.97 20.0783 21.5485 20.8284 20.7983C21.5786 20.0482 22 19.0308 22 17.97V13.8999"/>
        <path d="M2 9.96997H5.37006C6.16571 9.96997 6.92872 10.286 7.49133 10.8486C8.05394 11.4112 8.37006 12.1743 8.37006 12.97C8.37006 13.7656 8.05394 14.5287 7.49133 15.0913C6.92872 15.6539 6.16571 15.97 5.37006 15.97H2" />
    </svg>
    )
}
