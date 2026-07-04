import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../../../lib/supabaseClient';
import { setSession, setProfile, setLoading } from '../slice';
import { authService } from '../services/authService';
import type { Session } from '@supabase/supabase-js';

export function useAuthSession() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(true));

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      dispatch(setSession(session));
      if (session?.user) {
        let profile = await authService.getProfile(session.user.id);
        
        // Handle Google Auth Profile Creation
        if (!profile) {
          const pendingRole = localStorage.getItem('pendingRole');
          const pendingCollegeId = localStorage.getItem('pendingCollegeId');
          const pendingPhone = localStorage.getItem('pendingPhone');
          const pendingBio = localStorage.getItem('pendingBio');
          const pendingInviteCode = localStorage.getItem('pendingInviteCode');
          const pendingFullName = localStorage.getItem('pendingFullName');
          const pendingRollNumber = localStorage.getItem('pendingRollNumber');
          
          if (pendingCollegeId && pendingRole) {
            try {
              // Create the profile manually since trigger skipped it due to missing metadata in OAuth
              const { data, error } = await supabase.from('profiles').insert({
                id: session.user.id,
                college_id: pendingCollegeId,
                role: pendingRole,
                full_name: pendingFullName || session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'New User',
                avatar_url: session.user.user_metadata?.avatar_url,
                phone: pendingPhone || null,
                bio: pendingBio || null,
              }).select().single();
              
              if (!error && data) {
                profile = data as any;
                localStorage.removeItem('pendingRole');
                localStorage.removeItem('pendingCollegeId');
                localStorage.removeItem('pendingPhone');
                localStorage.removeItem('pendingBio');
                localStorage.removeItem('pendingFullName');
                localStorage.removeItem('pendingRollNumber');
                
                // Also insert into specific role table
                if (pendingRole === 'student') {
                  const generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                  // 5 minute expiration
                  const expiresAt = new Date();
                  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

                  await supabase.from('students').insert({ 
                    id: session.user.id, 
                    college_id: pendingCollegeId,
                    parent_invite_code: generatedCode,
                    parent_invite_code_expires_at: expiresAt.toISOString(),
                    enrollment_number: pendingRollNumber || null
                  });
                } else if (pendingRole === 'parent') {
                  await supabase.from('parents').insert({ id: session.user.id, college_id: pendingCollegeId });
                  
                  if (pendingInviteCode && pendingRollNumber) {
                    const { error: rpcError } = await supabase.rpc('redeem_parent_invite_code', {
                      invite_code: pendingInviteCode,
                      roll_number: pendingRollNumber,
                      p_parent_id: session.user.id
                    });
                    if (rpcError) console.error("Failed to redeem invite code:", rpcError);
                  }
                }
              }
            } catch (err) {
              console.error("Failed to create OAuth profile", err);
            }
          } else {
            // They bypassed the signup form
            await supabase.auth.signOut();
            window.location.href = '/signup?error=Please%20select%20your%20Role%20and%20College%20first.';
            return;
          }
        }
        
        dispatch(setProfile(profile));
      } else {
        dispatch(setLoading(false));
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
      dispatch(setSession(session));
      if (session?.user) {
        let profile = await authService.getProfile(session.user.id);
        
        // Handle Google Auth Profile Creation on redirect
        if (!profile) {
          const pendingRole = localStorage.getItem('pendingRole');
          const pendingCollegeId = localStorage.getItem('pendingCollegeId');
          const pendingPhone = localStorage.getItem('pendingPhone');
          const pendingBio = localStorage.getItem('pendingBio');
          const pendingInviteCode = localStorage.getItem('pendingInviteCode');
          const pendingFullName = localStorage.getItem('pendingFullName');
          const pendingRollNumber = localStorage.getItem('pendingRollNumber');
          
          if (pendingCollegeId && pendingRole) {
            try {
              const { data, error } = await supabase.from('profiles').insert({
                id: session.user.id,
                college_id: pendingCollegeId,
                role: pendingRole,
                full_name: pendingFullName || session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'New User',
                avatar_url: session.user.user_metadata?.avatar_url,
                phone: pendingPhone || null,
                bio: pendingBio || null,
              }).select().single();
              
              if (!error && data) {
                profile = data as any;
                localStorage.removeItem('pendingRole');
                localStorage.removeItem('pendingCollegeId');
                localStorage.removeItem('pendingPhone');
                localStorage.removeItem('pendingBio');
                localStorage.removeItem('pendingFullName');
                localStorage.removeItem('pendingRollNumber');
                
                if (pendingRole === 'student') {
                  const generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
                  const expiresAt = new Date();
                  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

                  await supabase.from('students').insert({ 
                    id: session.user.id, 
                    college_id: pendingCollegeId,
                    parent_invite_code: generatedCode,
                    parent_invite_code_expires_at: expiresAt.toISOString(),
                    enrollment_number: pendingRollNumber || null
                  });
                } else if (pendingRole === 'parent') {
                  await supabase.from('parents').insert({ id: session.user.id, college_id: pendingCollegeId });
                  
                  if (pendingInviteCode && pendingRollNumber) {
                    const { error: rpcError } = await supabase.rpc('redeem_parent_invite_code', {
                      invite_code: pendingInviteCode,
                      roll_number: pendingRollNumber,
                      p_parent_id: session.user.id
                    });
                    if (rpcError) console.error("Failed to redeem invite code:", rpcError);
                  }
                }
              }
            } catch (err) {
              console.error("Failed to create OAuth profile", err);
            }
          } else {
            await supabase.auth.signOut();
            window.location.href = '/signup?error=Please%20select%20your%20Role%20and%20College%20first.';
            return;
          }
        }
        
        dispatch(setProfile(profile));
      } else {
        dispatch(setProfile(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);
}
