import {
  Avatar as AvatarPrimitive,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from "@/shared/hooks/useAuth";

function Avatar() {
  const { user, isLoading } = useAuth();

  const userName = user?.name;
  const userRole = user?.roles;

  if (isLoading) {
    return (
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  return (
    <div className="ml-1 flex items-center gap-2.5 border-l border-ink-200 pl-2 sm:pl-3">
      <div className="hidden text-right leading-tight sm:block">
        <div className="text-[13px] font-semibold text-ink-900">{userName}</div>
        <div className="text-[11px] text-ink-500">{userRole?.join(", ")}</div>
      </div>

      <div className="relative">
        <AvatarPrimitive>
          <AvatarImage src={user?.avatar_url} />

          <AvatarFallback>
            <span className="text-sm text-ink-500">
              {userName?.slice(0, 2)}
            </span>
          </AvatarFallback>
        </AvatarPrimitive>
      </div>
    </div>
  );
}

export default Avatar;
