import { PageTitle } from '@/components/common/PageTitle'
import { SettingsList } from '../components'

/**
 * Full page listing the system settings (admin only).
 */
export default function SettingsPage() {
  return (
    <>
      <PageTitle>Configuración</PageTitle>

      <SettingsList />
    </>
  )
}
