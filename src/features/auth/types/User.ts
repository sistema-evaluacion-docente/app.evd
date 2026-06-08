export interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  active: boolean;
  department_id: number;
  roles: string[];
  avatar_url: string;

  createdAt: string;
  updatedAt: string;
}
