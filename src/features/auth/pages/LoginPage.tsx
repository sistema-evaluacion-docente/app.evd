import BrandPanel from "../components/BrandPanel";
import LoginForm from "../components/LoginForm";

function LoginPage() {
  return (
    <div className="grid min-h-screen grid-rows-[100px_1fr] md:grid-rows-1 md:grid-cols-2">
      <BrandPanel />
      <LoginForm />
    </div>
  );
}

export default LoginPage;
