import { ReactElement, SVGProps } from "react";
import { twMerge } from "tailwind-merge";
/**
 * The wrapper for SVG path property. Provides common default settinds for the SVG files
 * @param iconProps additional properties for the svg
 * @param className defaults for the specific svg 
 * @param children set of path attributes
 */
export function SvgPathWrapper(
    {iconProps, className, children}: {iconProps: SVGProps<SVGSVGElement>, className?: string, children: ReactElement | ReactElement[]} ) {

    return (
        <svg {...iconProps}
            className={twMerge('w-[24px] h-[24px] stroke-2 fill-none', className, iconProps.className)}
            aria-hidden="true" 
            viewBox="0 0 24 24"
            height="1em"
            stroke="currentColor" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
        >
            {children}
        </svg>
    )
}