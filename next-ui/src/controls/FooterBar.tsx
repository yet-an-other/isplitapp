const version = import.meta.env.VITE_VERSION as string;
const isDev = import.meta.env.DEV;

export function FooterBar() {
    return (
        <div className={`h-24 flex flex-col items-end justify-center w-full border-t dark:border-t-gray-800`}>
            <p className="text-xs mr-unit-xs">
                v{version}{isDev && '-dev'} 
            </p>
        </div>
    )
}