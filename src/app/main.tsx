import { Toaster } from "@/components/ui/sonner.tsx";
import { UserProvider } from "@/context/UserContext.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <App />
      <Toaster />
    </UserProvider>
  </StrictMode>,
);
