import { Outlet, useNavigate } from "react-router-dom";
import { FooterBar } from "../controls/FooterBar";
import HeaderBar from "../controls/HeaderBar";
import { NextUIProvider } from "@nextui-org/react";
import { AlertsProvider } from "../controls/AlertContext";

export function Layout() {
  
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <main className="text-foreground bg-background flex flex-col items-center ">
        <AlertsProvider>
          <HeaderBar />
            <div className="min-h-[calc(100vh-161px)] flex flex-col items-center pb-24 pt-8 max-w-5xl w-full">
              <Outlet />
            </div>
          <FooterBar />
        </AlertsProvider>
      </main>
    </NextUIProvider>
  )
}
