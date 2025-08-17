import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FooterBar } from "../controls/FooterBar";
import HeaderBar from "../controls/HeaderBar";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useEffect } from "react";

export function Layout() {
  
  const navigate = useNavigate();

  return (
    <HeroUIProvider navigate={navigate}>
      <ToastProvider 
        placement="bottom-center"
        maxVisibleToasts={3}
        toastProps={{
          radius: "md",
          variant: "flat",
          timeout: 5000,
        }}
      />
      <main className="text-foreground bg-background flex flex-col items-center">
        <ScrollToTop />
        <HeaderBar />
          <div className="min-h-[calc(100vh-161px)] flex flex-col items-center pb-24 pt-8 max-w-5xl w-full">
            <Outlet />
          </div>
        <FooterBar />
      </main>
    </HeroUIProvider>
  )
}

export const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}
