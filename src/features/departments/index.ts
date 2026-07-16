export type {
  CreateDepartmentPayload,
  Department,
  DepartmentDirector,
  UpdateDepartmentPayload,
} from './types/Department'

export { default as assignDepartmentDirector } from './api/assignDepartmentDirector'
export { default as createDepartment } from './api/createDepartment'
export { default as getDepartments } from './api/getDepartments'
export { default as updateDepartment } from './api/updateDepartment'

export { default as useAssignDepartmentDirector } from './hooks/useAssignDepartmentDirector'
export { default as useCreateDepartment } from './hooks/useCreateDepartment'
export { default as useDepartmentColumns } from './hooks/useDepartmentColumns'
export { default as useGetDepartments } from './hooks/useGetDepartments'
export { default as useUpdateDepartment } from './hooks/useUpdateDepartment'
