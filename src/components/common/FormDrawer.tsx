import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Save, Undo2 } from "lucide-react";
import type { ReactNode } from "react";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submitSubmittingLabel?: string;
  submitDisabled?: boolean;
  cancelLabel?: string;
  cancelDisabled?: boolean;
  contentClassName?: string;
  formClassName?: string;
  footerClassName?: string;
}

function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Guardar",
  submitSubmittingLabel = "Guardando...",
  submitDisabled,
  cancelLabel = "Cancelar",
  cancelDisabled,
  contentClassName,
  formClassName,
  footerClassName,
}: FormDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className={cn("w-full sm:max-w-xl", contentClassName)}>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>

          {description ? (
            <DrawerDescription>{description}</DrawerDescription>
          ) : null}
        </DrawerHeader>

        <form
          onSubmit={onSubmit}
          className={cn("space-y-4 px-4 pb-4", formClassName)}
        >
          {children}

          <DrawerFooter className={cn("px-0 pb-0", footerClassName)}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cancelDisabled ?? isSubmitting}
            >
              <Undo2 />
              {cancelLabel}
            </Button>

            <Button type="submit" disabled={submitDisabled ?? isSubmitting}>
              <Save />
              {isSubmitting
                ? (submitSubmittingLabel ?? submitLabel)
                : submitLabel}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export default FormDrawer;
