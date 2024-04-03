import { ReactNode, useEffect } from "react"
import { twMerge } from "tailwind-merge"

export interface AlertProps {
    id?: string
    message: string
    severity: 'info' | 'success' | 'warning' | 'error'
    timeout: number
    handleDismiss?: (() => void) | undefined
}

export const Alert = ({ message = '', severity = 'info', timeout = 0, handleDismiss = undefined }: AlertProps) => {
  useEffect(() => {
    if (timeout > 0 && handleDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, timeout * 1000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissAlert = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    handleDismiss && handleDismiss();
  }

  return message?.length && (
    <div className={twMerge("rounded-lg px-4 py-3 mb-4 shadow-md pointer-events-auto", classNames[severity])} role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className={twMerge("fill-current h-6 w-6 mr-4 ", svgFillColors[severity])} viewBox="0 0 24 24">
            <path d={svgPaths[severity]} />
          </svg>
        </div>
        <div>
          <p className={"font-bold"}>{severity.toUpperCase()}</p>
          <p className={"text-md mt-2"}>{message}</p>
        </div>
        <div className="ml-auto">
            {handleDismiss && (
                <button className="text-sm font-bold" type="button" onClick={dismissAlert}>
                    <svg className="fill-current h-6 w-6 text-gray-500" viewBox="0 0 20 20">
                        <path d="M6.83 5L10 8.17 13.17 5 15 6.83 11.83 10 15 13.17 13.17 15 10 11.83 6.83 15 5 13.17 8.17 10 5 6.83 6.83 5z" />
                    </svg>
                </button>
            )}
        </div>
      </div>
    </div>
  )
}

export const AlertsWrapper = ({ children }: {children: ReactNode}) => {
  return (
    <div className="fixed bottom-24 p-4 z-50 pointer-events-none max-w-sm min-w-fit w-full">
      {children}
    </div>
  )
}

const classNames = {
    info: 'bg-primary-50 border-primary-500 text-primary-500', //'bg-blue-50 border-blue-500 text-blue-700',
    success: 'bg-green-50 border-green-500 text-green-700',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-700',
    error: 'bg-red-50 border-red-500 text-red-700',
}
  
const svgPaths = {
    info: 'M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z',
    success: 'M5.64 13.36l-2.28-2.28-1.28 1.28 3.56 3.56 7.72-7.72-1.28-1.28z',
    warning: 'M10 4.5a1 1 0 0 1 2 0v5a1 1 0 1 1-2 0V4.5zm0 8a1 1 0 1 1 2 0v.5a1 1 0 1 1-2 0v-.5z',
    error: 'M10 1C4.48 1 0 5.48 0 11s4.48 10 10 10 10-4.48 10-10S15.52 1 10 1zm1 15H9v-2h2v2zm0-4H9V5h2v7z',
}
  
const svgFillColors = {
    info: 'text-primary-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500',
}
