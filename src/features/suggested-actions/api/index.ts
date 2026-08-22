import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { Setting } from '@/features/admin'
import {
  isDepartmentOwnedSetting,
  settingByKeyQueryOptions,
  useCreateSetting,
  useGetSettingByKey,
  useUpdateSetting,
} from '@/features/admin'
import useAuth from '@/hooks/useAuth'
import { ApiError } from '@/lib/apiError'
import {
  parseSuggestedActions,
  serializeSuggestedActions,
  SUGGESTED_ACTIONS_DESCRIPTION,
  SUGGESTED_ACTIONS_KEY,
  SUGGESTED_ACTIONS_VALUE_TYPE,
} from '../lib/suggestedActions'
import type { SuggestedAction } from '../types'

/**
 * Identity of a stored list at a point in time. The whole list lives in a
 * single row, so "did anyone else touch it" is the same question as "is this
 * still the row and revision I read".
 */
function revisionOf(setting: Setting | null | undefined): string {
  return setting ? `${setting.id}:${setting.updated_at}` : 'none'
}

/**
 * Department this page reads and writes for — the one the signed-in director
 * belongs to. `null` when the account has none, which is the one state where
 * the page cannot work at all.
 *
 * Sending it explicitly is not the redundancy it looks like. The backend only
 * pins a request to the caller's own department when it treats them as a
 * director, and an account that *also* holds ADMIN is treated as an admin
 * instead. For those, an omitted `department_id` means "institutional" — so
 * leaving it out silently reads and writes the wrong scope.
 */
function useDepartmentId(): number | null {
  const { user } = useAuth()

  return user?.department_id ?? null
}

/**
 * The suggested actions in effect for the director's department: their own
 * list when they have one, the institutional list otherwise, and an empty list
 * when neither exists yet.
 *
 * `setting` is handed back alongside the parsed actions because the page needs
 * it for everything else — which scope the list came from, whose change it was,
 * and which revision a save is built on.
 *
 * @example
 * const { actions, setting, isPending } = useGetSuggestedActions();
 */
export function useGetSuggestedActions() {
  const departmentId = useDepartmentId()

  const query = useGetSettingByKey(SUGGESTED_ACTIONS_KEY, departmentId ?? undefined)

  const setting = query.data ?? null

  const actions = useMemo(() => parseSuggestedActions(setting?.value), [setting?.value])

  return { ...query, setting, actions, departmentId }
}

/**
 * Writes the whole list back.
 *
 * Which request that is depends on where the list currently lives: a
 * department that already has its own list gets a `PUT`, while one still
 * reading the institutional list gets a `POST` that creates its own copy —
 * a director may read a `GLOBAL` value but never write to it.
 *
 * Because the entire list is one row, two directors saving from separate tabs
 * would silently overwrite each other. So the row is re-read first and the
 * save is refused when it no longer matches the revision the page was built
 * on, which turns a lost edit into a message asking to reload.
 *
 * @example
 * const { mutate: save } = useSaveSuggestedActions();
 * save({ actions: next, baseSetting: setting, changeReason: 'Se agregó una acción' });
 */
export function useSaveSuggestedActions() {
  const departmentId = useDepartmentId()
  const queryClient = useQueryClient()
  const { mutateAsync: createSetting } = useCreateSetting()
  const { mutateAsync: updateSetting } = useUpdateSetting()

  return useMutation({
    mutationFn: async ({
      actions,
      baseSetting,
      changeReason,
    }: {
      actions: SuggestedAction[]
      /** The setting the page was built on; `null` when the key had no value. */
      baseSetting: Setting | null
      changeReason: string
    }) => {
      if (departmentId == null) {
        throw new ApiError(
          'Tu cuenta no tiene un departamento asignado, así que no hay una lista de departamento que guardar.',
        )
      }

      const current = await queryClient.fetchQuery({
        ...settingByKeyQueryOptions(SUGGESTED_ACTIONS_KEY, departmentId),
        staleTime: 0,
      })

      if (revisionOf(current) !== revisionOf(baseSetting)) {
        throw new ApiError(
          'Otra persona cambió las acciones sugeridas mientras editabas. Recarga la página para no sobrescribir su trabajo.',
        )
      }

      const value = serializeSuggestedActions(actions)

      if (current && isDepartmentOwnedSetting(current)) {
        return updateSetting({
          settingId: current.id,
          payload: { value, change_reason: changeReason },
        })
      }

      return createSetting({
        key: SUGGESTED_ACTIONS_KEY,
        value,
        value_type: SUGGESTED_ACTIONS_VALUE_TYPE,
        description: SUGGESTED_ACTIONS_DESCRIPTION,
        department_id: departmentId,
      })
    },
  })
}
