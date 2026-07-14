import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

type Props = {
  title: string;
  url: string;
};

function EvaluationSection({ title, url }: Props) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      <div>
        <Link to={url}>
          <Button size="sm">
            <ArrowRight />
            Ver todos
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default EvaluationSection;
