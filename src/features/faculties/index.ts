export type {
  Faculty,
  CreateFacultyPayload,
  UpdateFacultyPayload,
} from "./types/Faculty";

export { default as getFaculties } from "./api/getFaculties";
export { default as createFaculty } from "./api/createFaculty";
export { default as updateFaculty } from "./api/updateFaculty";

export { default as useGetFaculties } from "./hooks/useGetFaculties";
export { default as useCreateFaculty } from "./hooks/useCreateFaculty";
export { default as useUpdateFaculty } from "./hooks/useUpdateFaculty";
export { default as useFacultyColumns } from "./hooks/useFacultyColumns";
