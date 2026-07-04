import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../features/auth/services/authService';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'parent' | 'faculty' | 'warden' | 'college_admin'>('student');
  const [collegeId, setCollegeId] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [parentInviteCode, setParentInviteCode] = useState('');
  const [colleges, setColleges] = useState<{id: string, name: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('error') || '';
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadColleges() {
      try {
        const { data, error } = await authService.supabase
          .from('colleges')
          .select('id, name')
          .is('deleted_at', null);
          
        if (error) throw error;
          
        if (data && data.length > 0) {
          setColleges(data);
          if (!collegeId) setCollegeId(data[0].id); // Auto-select the first one (DTU)
        } else {
          setColleges([]);
          setError("No colleges found in the database. Please run the SQL snippet.");
        }
      } catch (err: any) {
        console.error("Error loading colleges:", err);
        setError(err.message || "Failed to load colleges");
        setColleges([]);
      }
    }
    loadColleges();
  }, []);

  const normalizeRollNumber = (roll: string) => {
    let normalized = roll.trim().toUpperCase();
    normalized = normalized.replace(/^(\d{2})\//, '2K$1/');
    return normalized;
  };

  const validateRollNumber = (roll: string) => {
    const regex = /^2K\d{2}\/[A-Z]{2,3}\/\d{1,4}$/;
    return regex.test(roll);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!collegeId) {
      setError('Please select a college (or enter its ID for Phase 0 testing)');
      return;
    }
    
    let normalizedRollNumber = '';
    if (role === 'student' || role === 'parent') {
      if (!rollNumber) {
        setError(role === 'student' ? 'Roll Number is required.' : 'Student Roll Number is required.');
        return;
      }
      normalizedRollNumber = normalizeRollNumber(rollNumber);
      if (!validateRollNumber(normalizedRollNumber)) {
        setError('Invalid Roll Number format. Expected format: 2KXX/XX/XXX or XX/XX/XXX');
        return;
      }
    }
    
    if (role === 'parent' && !parentInviteCode) {
      setError('A Student Invite Code is required to register as a Parent.');
      return;
    }

    setLoading(true);
    
    if (role === 'parent' && parentInviteCode) {
      const cleanCode = parentInviteCode.trim().toUpperCase();
      
      // DEEP DEBUGGING
      const { data: testStd } = await authService.supabase
        .from('students')
        .select('id, enrollment_number, parent_invite_code, parent_invite_code_expires_at')
        .eq('enrollment_number', normalizedRollNumber);
        
      if (!testStd || testStd.length === 0) {
        setError(`Debug: No student found with roll number ${normalizedRollNumber}`);
        setLoading(false);
        return;
      }
      
      const std = testStd[0];
      if (std.parent_invite_code !== cleanCode) {
        setError(`Debug: Code mismatch. Expected ${std.parent_invite_code}, Got ${cleanCode}`);
        setLoading(false);
        return;
      }
      
      const now = new Date();
      const exp = new Date(std.parent_invite_code_expires_at);
      if (exp <= now) {
        setError(`Debug: Code expired. Exp: ${exp.toISOString()}, Now: ${now.toISOString()}`);
        setLoading(false);
        return;
      }

      const { data: isValid, error: rpcError } = await authService.supabase.rpc('validate_parent_invite_code', {
        invite_code: cleanCode,
        roll_number: normalizedRollNumber
      });
      
      if (rpcError) {
        console.error("RPC Error validating code:", rpcError);
        setError(`Database Error: ${rpcError.message} / ${rpcError.details}`);
        setLoading(false);
        return;
      }
      
      if (!isValid) {
        setError('Invalid or expired Student Invite Code, or Roll Number does not match.');
        setLoading(false);
        return;
      }
    }
    
    try {
      const authData = await authService.signUp(email, password, {
        full_name: fullName,
        intended_role: role,
        college_id: collegeId,
        phone: phone || undefined,
        bio: bio || undefined,
        enrollment_number: (role === 'student' || role === 'parent') ? normalizedRollNumber : undefined,
        parent_invite_code: role === 'parent' ? parentInviteCode.trim() : undefined,
      });
      
      // CREATE THE MAPPING!
      if (role === 'parent' && parentInviteCode && authData?.user?.id) {
        const cleanCode = parentInviteCode.trim().toUpperCase();
        await authService.supabase.rpc('redeem_parent_invite_code', {
          invite_code: cleanCode,
          roll_number: normalizedRollNumber,
          p_parent_id: authData.user.id
        });
      }

      // We now skip onboarding entirely and go straight to their dashboard
      navigate(`/${role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!fullName) {
      setError('Please enter your Full Name before using Google Sign In');
      return;
    }
    if (!collegeId) {
      setError('Please select a college (or enter its ID) before using Google Sign In');
      return;
    }
    
    let normalizedRollNumber = '';
    if (role === 'student' || role === 'parent') {
      if (!rollNumber) {
        setError(role === 'student' ? 'Roll Number is required.' : 'Student Roll Number is required.');
        return;
      }
      normalizedRollNumber = normalizeRollNumber(rollNumber);
      if (!validateRollNumber(normalizedRollNumber)) {
        setError('Invalid Roll Number format. Expected format: 2KXX/XX/XXX or XX/XX/XXX');
        return;
      }
    }

    if (role === 'parent' && !parentInviteCode) {
      setError('A Student Invite Code is required to register as a Parent.');
      return;
    }

    setLoading(true);

    if (role === 'parent' && parentInviteCode) {
      const cleanCode = parentInviteCode.trim().toUpperCase();
      const { data: isValid, error: rpcError } = await authService.supabase.rpc('validate_parent_invite_code', {
        invite_code: cleanCode,
        roll_number: normalizedRollNumber
      });
      
      if (rpcError) {
        console.error("RPC Error validating code:", rpcError);
        setError(`Database Error: ${rpcError.message} / ${rpcError.details}`);
        setLoading(false);
        return;
      }
      
      if (!isValid) {
        setError('Invalid or expired Student Invite Code, or Roll Number does not match.');
        setLoading(false);
        return;
      }
    }

    // We save these in localStorage so useAuthSession can pick them up when Google redirects back
    localStorage.setItem('pendingRole', role);
    localStorage.setItem('pendingCollegeId', collegeId);
    localStorage.setItem('pendingFullName', fullName.trim());
    console.log("Saving pending data:", { role, collegeId, fullName });
    if (phone) localStorage.setItem('pendingPhone', phone);
    if (bio) localStorage.setItem('pendingBio', bio);
    if (role === 'student' || role === 'parent') localStorage.setItem('pendingRollNumber', normalizedRollNumber);
    if (role === 'parent' && parentInviteCode) localStorage.setItem('pendingInviteCode', parentInviteCode.trim().toUpperCase());
    
    try {
      setLoading(true);
      const { error } = await authService.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + `/${role}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-xl shadow-gray-200/50 dark:shadow-black/50 sm:rounded-2xl sm:px-10 border border-gray-100 dark:border-gray-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
              <input
                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address *</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password *</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role *</label>
                <select
                  value={role} onChange={(e) => setRole(e.target.value as any)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="faculty">Faculty</option>
                  <option value="warden">Warden</option>
                  <option value="college_admin">College Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College *</label>
                <select
                  required
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  {colleges.length === 0 && <option value="">Loading colleges...</option>}
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(role === 'student' || role === 'parent') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {role === 'student' ? 'Roll Number *' : 'Student Roll Number *'}
                </label>
                <input
                  type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g. 2K23/CS/338 or 23/CS/338"
                  className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm uppercase"
                />
              </div>
            )}

            {role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Invite Code *</label>
                <input
                  type="text" required value={parentInviteCode} onChange={(e) => setParentInviteCode(e.target.value)} placeholder="Ask your student for their code"
                  className="mt-1 block w-full rounded-xl border border-primary-500 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-gray-900 dark:text-white shadow-sm focus:border-primary-600 focus:ring-primary-600 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">This links your account to your student's dashboard.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number (Optional)</label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890"
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio (Optional)</label>
              <textarea
                rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself..."
                className="mt-1 block w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit" disabled={loading}
                className="flex w-full justify-center rounded-xl border border-transparent bg-primary-600 py-2.5 px-4 text-sm font-medium text-white shadow-md shadow-primary-500/20 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {loading ? 'Creating account...' : 'Create account with Email'}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full justify-center items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
