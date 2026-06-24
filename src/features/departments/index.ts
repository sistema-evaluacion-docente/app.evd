export type {
  Department,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from "./types/Department";

export {
  default as getDepartments,
} from "./api/getDepartments";
export {
  default as createDepartment,
} from "./api/createDepartment";
export {
  default as updateDepartment,
} from "./api/updateDepartment";

export { default as useGetDepartments } from "./hooks/useGetDepartments";
export { default as useCreateDepartment } from "./hooks/useCreateDepartment";
export { default as useUpdateDepartment } from "./hooks/useUpdateDepartment";
export { default as useDepartmentColumns } from "./hooks/useDepartmentColumns";
