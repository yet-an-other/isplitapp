import { useTranslation } from "react-i18next";

export function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="text-5xl w-full m-5 p-4">
      <span className="font-bold">404</span> {t('notFound.title')}
    </div>
  )
}