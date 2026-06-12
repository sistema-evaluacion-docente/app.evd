import type { User } from "@/features/auth/types/User";
import { useCallback } from "react";
import { toast } from "sonner";

import useDisableUser from "./useDisableUser";
import useEnableUser from "./useEnableUser";

export default function useUserStatusActions() {
  const { mutateAsync: disableUser, isPending: isDisablingUser } =
    useDisableUser();
  const { mutateAsync: enableUser, isPending: isEnablingUser } =
    useEnableUser();

  const handleDisableUser = useCallback(
    async (user: User) => {
      if (!user.active) {
        toast.info(`${user.name} ya se encuentra inactivo.`);
        return;
      }

      try {
        await disableUser({ userId: user.uid });
        toast.success(`Usuario ${user.name} deshabilitado correctamente.`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible deshabilitar el usuario.";

        toast.error(message);
      }
    },
    [disableUser],
  );

  const handleEnableUser = useCallback(
    async (user: User) => {
      if (user.active) {
        toast.info(`${user.name} ya se encuentra activo.`);
        return;
      }

      try {
        await enableUser({ userId: user.uid });
        toast.success(`Usuario ${user.name} habilitado correctamente.`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible habilitar el usuario.";

        toast.error(message);
      }
    },
    [enableUser],
  );

  return {
    isDisablingUser,
    isEnablingUser,
    handleDisableUser,
    handleEnableUser,
  };
}
