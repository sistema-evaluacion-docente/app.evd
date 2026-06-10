import AppLayoutSkeleton from "@/components/skeletons/AppLayoutSkeleton";
import useAuth from "@/shared/hooks/useAuth";
import BrandPanel from "../components/BrandPanel";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AppLayoutSkeleton />;
  }

  return (
    <div className="grid min-h-screen grid-rows-[100px_1fr] md:grid-rows-1 md:grid-cols-2">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}

export default LoginPage;
