import { Link } from "wouter";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

type HeaderPageProps = {
  title: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
};

function HeaderPage({ title, children, icon }: HeaderPageProps) {
  return (
    <header>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/dashboard">Inicio</Link>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-bold text-xl">{title}</h2>
        </div>

        {children}
      </div>
    </header>
  );
}

export default HeaderPage;
