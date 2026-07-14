import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "wouter";

type Props = {
  title: string;
  url: string;
  icon?: ReactNode;
};

function EvaluationSection({ title, url, icon }: Props) {
  return (
    <div className="flex justify-between items-center px-1 mt-16">
      <div className="flex gap-2 items-center">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div>
        <Link to={url}>
          <Button size="xs" variant="outline">
            <ArrowRight />
            Ver todos
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default EvaluationSection;
