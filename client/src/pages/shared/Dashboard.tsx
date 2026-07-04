import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../app/store';
import { setProfile } from '../../features/auth/slice';
import { authService } from '../../features/auth/services/authService';
import { Eye, EyeOff, Copy, Check, Edit2, Save, X, RefreshCw, Users, Plus, Link as LinkIcon } from 'lucide-react';

export function Dashboard() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collegeName, setCollegeName] = useState('Loading...');
  const [rollNumber, setRollNumber] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRollNumber, setEditRollNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Linked Accounts State
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [isLinkingChild, setIsLinkingChild] = useState(false);
  const [linkRollNumber, setLinkRollNumber] = useState('');
  const [linkInviteCode, setLinkInviteCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const [debugLog, setDebugLog] = useState<any>({});

  useEffect(() => {
    if (!profile) return;
    
    setEditBio(profile.bio || '');
    setEditPhone(profile.phone || '');
    if (rollNumber) setEditRollNumber(rollNumber);

    async function loadData() {
      // ... previous load data code ...
      // Get College Name
      const { data: col } = await authService.supabase
        .from('colleges')
        .select('name')
        .eq('id', profile!.college_id)
        .single();
      if (col) setCollegeName(col.name);

      if (profile?.role === 'student') {
        const { data: std } = await authService.supabase
          .from('students')
          .select('parent_invite_code, parent_invite_code_expires_at, enrollment_number')
          .eq('id', profile.id)
          .maybeSingle();
        if (std) {
          setInviteCode(std.parent_invite_code);
          setCodeExpiresAt(std.parent_invite_code_expires_at);
          setRollNumber(std.enrollment_number);
        }

        const { data: links } = await authService.supabase
          .from('parent_student_links')
          .select('parent_id')
          .eq('student_id', profile.id)
          .eq('status', 'active');
        
        if (links && links.length > 0) {
          const parentIds = links.map(l => l.parent_id);
          const { data: parents } = await authService.supabase
            .from('profiles')
            .select('*')
            .in('id', parentIds);
            
          if (parents) setLinkedAccounts(parents);
        }
      } else if (profile?.role === 'parent') {
        const { data: links, error: linksErr } = await authService.supabase
          .from('parent_student_links')
          .select('student_id')
          .eq('parent_id', profile.id)
          .eq('status', 'active');
          
        if (links && links.length > 0) {
          const studentIds = links.map(l => l.student_id);
          const { data: studentsProfile, error: spErr } = await authService.supabase
            .from('profiles')
            .select('*')
            .in('id', studentIds);
            
          const { data: studentsData, error: sdErr } = await authService.supabase
            .from('students')
            .select('id, enrollment_number')
            .in('id', studentIds);
            
          // If we got profiles, render them regardless of studentsData
          if (studentsProfile) {
            const combined = studentsProfile.map(sp => {
              const sd = studentsData?.find(s => s.id === sp.id);
              return { ...sp, roll_number: sd?.enrollment_number };
            });
            setLinkedAccounts(combined);
            if (combined.length > 0 && combined[0].roll_number) {
              setRollNumber(combined[0].roll_number);
            }
            
            // If combined is empty, store a debug string in the UI state
            if (combined.length === 0) {
              setDebugLog(`Diagnostics: Links=${links.length}, ProfilesFetched=${studentsProfile.length}, ProfileErr=${(spErr as any)?.message}, DataErr=${(sdErr as any)?.message}`);
            } else {
              setDebugLog('');
            }
          }
        } else {
           setDebugLog(`Diagnostics: Links=${links?.length || 0}, LinkErr=${(linksErr as any)?.message}`);
        }
      }
    }
    loadData();
  }, [profile]);

  // Update countdown timer
  useEffect(() => {
    if (!codeExpiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(codeExpiresAt).getTime();
      const distance = expires - now;
      
      if (distance < 0) {
        setTimeLeft('Expired');
        setInviteCode(null);
        setCodeExpiresAt(null);
        clearInterval(interval);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  if (!profile) return null;

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Update Profile (Bio & Phone)
      const { error: profileError } = await authService.supabase
        .from('profiles')
        .update({ bio: editBio, phone: editPhone })
        .eq('id', profile.id);
        
      if (profileError) throw profileError;
      
      // 2. Update Student Roll Number if applicable
      if ((profile.role === 'student' || profile.role === 'parent') && editRollNumber) {
        let normalizedRoll = editRollNumber.trim().toUpperCase();
        normalizedRoll = normalizedRoll.replace(/^(\d{2})\//, '2K$1/');
        
        // Basic regex validation
        const regex = /^2K\d{2}\/[A-Z]{2,3}\/\d{1,4}$/;
        if (!regex.test(normalizedRoll)) {
          alert("Invalid Roll Number format. Expected format: 2KXX/XX/XXX");
          setIsSaving(false);
          return;
        }

        if (profile.role === 'student') {
          const { error: studentError } = await authService.supabase
            .from('students')
            .upsert({ 
              id: profile.id, 
              college_id: profile.college_id,
              enrollment_number: normalizedRoll 
            }, { onConflict: 'id' });
          if (studentError) throw studentError;
        } else if (profile.role === 'parent') {
          // Parents don't edit their student's roll numbers directly here, 
          // they are fixed. If a parent has multiple children, editing one doesn't make sense.
          // They must link new children via the invite code.
        }
        setRollNumber(normalizedRoll);
      }
      
      // Update local Redux state
      dispatch(setProfile({ ...profile, bio: editBio, phone: editPhone }));
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to save profile", err);
      alert(`Failed to save profile updates. Error: ${err?.message || err?.details || 'Roll number might be already taken.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLinkAnotherChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    try {
      let normalizedRoll = linkRollNumber.trim().toUpperCase();
      normalizedRoll = normalizedRoll.replace(/^(\d{2})\//, '2K$1/');
      const cleanCode = linkInviteCode.trim().toUpperCase();

      const { data: testStd } = await authService.supabase
        .from('students')
        .select('id, enrollment_number, parent_invite_code, parent_invite_code_expires_at')
        .eq('enrollment_number', normalizedRoll);
        
      if (!testStd || testStd.length === 0) {
        throw new Error(`Debug: No student found with roll number ${normalizedRoll}`);
      }
      
      const std = testStd[0];
      if (std.parent_invite_code !== cleanCode) {
        throw new Error(`Debug: Code mismatch. Expected ${std.parent_invite_code}, Got ${cleanCode}`);
      }
      
      const now = new Date();
      const exp = new Date(std.parent_invite_code_expires_at);
      if (exp <= now) {
        throw new Error(`Debug: Code expired locally. Exp: ${exp.toISOString()}, Now: ${now.toISOString()}`);
      }

      const { data: isValid, error: rpcError } = await authService.supabase.rpc('validate_parent_invite_code', {
        invite_code: cleanCode,
        roll_number: normalizedRoll
      });

      if (rpcError) {
        throw new Error(`Debug RPC Error: ${rpcError.message}`);
      }
      if (!isValid) {
        throw new Error('Debug: RPC validate_parent_invite_code returned false (likely SERVER clock expired the code immediately because of time zone/drift mismatch)');
      }

      const { error: redeemError } = await authService.supabase.rpc('redeem_parent_invite_code', {
        invite_code: cleanCode,
        roll_number: normalizedRoll,
        p_parent_id: profile.id
      });
      
      if (redeemError) throw redeemError;

      alert('Student linked successfully!');
      window.location.reload(); // Refresh to load new data
    } catch (err: any) {
      console.error("Failed to link student", err);
      alert(`Failed to link student: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLinking(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      
      const { error } = await authService.supabase
        .from('students')
        .upsert({ 
          id: profile.id,
          college_id: profile.college_id,
          parent_invite_code: generatedCode,
          parent_invite_code_expires_at: expiresAt.toISOString()
        }, { onConflict: 'id' });
        
      if (error) throw error;
      setInviteCode(generatedCode);
      setCodeExpiresAt(expiresAt.toISOString());
    } catch (err) {
      console.error("Failed to generate code", err);
      alert("Failed to generate invite code.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 text-4xl font-bold shadow-inner">
              {profile.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{profile.full_name}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 capitalize font-medium">{profile.role}</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Edit2 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditBio(profile.bio || '');
                  setEditPhone(profile.phone || '');
                  setEditRollNumber(rollNumber || '');
                }}
                disabled={isSaving}
                className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm disabled:opacity-50"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors text-sm font-medium shadow-md shadow-primary-500/20 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">College</h3>
            <p className="text-gray-900 dark:text-white font-medium">{collegeName}</p>
          </div>

          {(profile.role === 'student' || profile.role === 'parent') && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {profile.role === 'student' ? 'Roll Number' : 'Primary Student Roll Number'}
              </h3>
              {isEditing && profile.role === 'student' ? (
                <input 
                  type="text"
                  value={editRollNumber}
                  onChange={(e) => setEditRollNumber(e.target.value)}
                  placeholder="e.g. 2K23/CS/338"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white uppercase"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium font-mono">{rollNumber || 'Not available'}</p>
              )}
            </div>
          )}

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Phone Number</h3>
            {isEditing ? (
              <input 
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.phone || 'No phone provided.'}</p>
            )}
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bio</h3>
            {isEditing ? (
              <textarea 
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white resize-none"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.bio || 'No bio provided.'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-3">
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditBio(profile.bio || '');
                setEditPhone(profile.phone || '');
                setEditRollNumber(rollNumber || '');
              }}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl transition-colors text-sm font-medium border border-gray-200 dark:border-gray-700 shadow-sm disabled:opacity-50"
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors text-sm font-medium shadow-md shadow-primary-500/20 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}

        {/* Student Invite Code Section */}
        {profile.role === 'student' && (
          <div className="mt-6 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/50">
            <h3 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">
              Parent Invite Code
            </h3>
            
            {!inviteCode ? (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  You don't have an active invite code. Generate one to share with your parents. Codes expire in 5 minutes!
                </p>
                <button 
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors text-sm font-medium shadow-md shadow-primary-500/20 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? 'Generating...' : 'Generate 5-Min Invite Code'}</span>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Share this code and your roll number ({rollNumber}) with your parents.
                  <span className="block mt-1 font-medium text-red-500 dark:text-red-400">
                    Expires in: {timeLeft}
                  </span>
                </p>
                <div className="flex items-center space-x-3">
                  <div className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-widest bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    {showCode ? inviteCode : '••••••••'}
                  </div>
                  <button 
                    onClick={() => setShowCode(!showCode)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors"
                    title={showCode ? "Hide code" : "Show code"}
                  >
                    {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors flex items-center"
                    title="Copy code"
                  >
                    {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Linked Accounts Section */}
        {(profile.role === 'student' || profile.role === 'parent') && (
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Users className="text-gray-400" size={20} />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.role === 'student' ? 'Linked Parents / Guardians' : 'Linked Students'}
                </h2>
              </div>
              
              {profile.role === 'parent' && !isLinkingChild && (
                <button 
                  onClick={() => setIsLinkingChild(true)}
                  className="flex items-center space-x-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <Plus size={16} />
                  <span>Link Another Student</span>
                </button>
              )}
            </div>

            {isLinkingChild && profile.role === 'parent' && (
              <form onSubmit={handleLinkAnotherChild} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <LinkIcon size={16} className="mr-2" /> Link New Student
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Roll Number</label>
                    <input 
                      type="text" required value={linkRollNumber} onChange={e => setLinkRollNumber(e.target.value)}
                      placeholder="e.g. 2K23/CS/338"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Invite Code</label>
                    <input 
                      type="text" required value={linkInviteCode} onChange={e => setLinkInviteCode(e.target.value)}
                      placeholder="Ask student for code"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsLinkingChild(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg">Cancel</button>
                  <button type="submit" disabled={isLinking} className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg disabled:opacity-50">
                    {isLinking ? 'Linking...' : 'Link Student'}
                  </button>
                </div>
              </form>
            )}

            {linkedAccounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {linkedAccounts.map(account => (
                  <div key={account.id} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-lg font-bold">
                      {account.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{account.full_name}</p>
                      {profile.role === 'parent' && account.roll_number && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{account.roll_number}</p>
                      )}
                      {account.phone && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{account.phone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  No linked {profile.role === 'student' ? 'parents' : 'students'} found.
                </p>
                {debugLog && typeof debugLog === 'string' && (
                  <p className="text-xs text-red-500 font-mono break-all">{debugLog}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
