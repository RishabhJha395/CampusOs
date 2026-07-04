import { supabase } from '../../../lib/supabaseClient';
import type { Department, CreateDepartmentDTO, UpdateDepartmentDTO } from '../types';

export const departmentService = {
  async getDepartments(collegeId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('college_id', collegeId)
      .is('deleted_at', null)
      .order('name');
      
    if (error) throw error;
    return data || [];
  },

  async createDepartment(payload: CreateDepartmentDTO): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .insert(payload)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateDepartment(id: string, payload: UpdateDepartmentDTO): Promise<Department> {
    const { data, error } = await supabase
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteDepartment(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
      
    if (error) throw error;
  }
};
