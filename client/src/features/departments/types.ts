export interface Department {
  id: string;
  college_id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export type CreateDepartmentDTO = Pick<Department, 'name' | 'code' | 'college_id'>;
export type UpdateDepartmentDTO = Partial<Pick<Department, 'name' | 'code'>>;
