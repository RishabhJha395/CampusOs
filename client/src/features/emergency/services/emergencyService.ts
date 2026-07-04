import { supabase } from '../../../lib/supabaseClient';
import type { EmergencyAlert, CreateEmergencyDTO } from '../types';

export const emergencyService = {
  async getActiveAlerts(collegeId: string): Promise<EmergencyAlert[]> {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select(`
        *,
        student_rel:students (
          profiles (*)
        ),
        resolver:profiles!emergency_alerts_resolved_by_fkey(*)
      `)
      .eq('college_id', collegeId)
      .in('status', ['active', 'acknowledged'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Flatten the student -> profiles relationship for the UI
    return data.map((alert: any) => {
      const studentData = Array.isArray(alert.student_rel) ? alert.student_rel[0] : alert.student_rel;
      const profileData = Array.isArray(studentData?.profiles) ? studentData.profiles[0] : studentData?.profiles;
      
      return {
        ...alert,
        student: profileData
      };
    }) as unknown as EmergencyAlert[];
  },

  async getMyAlerts(studentId: string): Promise<EmergencyAlert[]> {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as unknown as EmergencyAlert[];
  },

  async createAlert(payload: CreateEmergencyDTO): Promise<EmergencyAlert> {
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as EmergencyAlert;
  },

  async resolveAlert(alertId: string, resolverId: string): Promise<void> {
    const { error } = await supabase
      .from('emergency_alerts')
      .update({ 
        status: 'resolved',
        resolved_by: resolverId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('emergency_alerts')
      .update({ status: 'acknowledged' })
      .eq('id', alertId);

    if (error) throw error;
  }
};
