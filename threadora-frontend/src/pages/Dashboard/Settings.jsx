import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings as SettingsIcon, User, ImagePlus, Save, Lock, Loader2, Shield, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errorUtils';
import { changePassword, updateProfile } from '../../api/authApi';
import { uploadToCloudinary } from '../../utils/cloudinary';

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

export default function Settings() {
  const { user, updateUser, isLoading } = useAuth();
  const [profile, setProfile] = useState({ username: '', avatarUrl: '' });
  const [initialProfile, setInitialProfile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const nextProfile = {
      username: user.username || '',
      avatarUrl: user.avatarUrl || ''
    };
    setProfile(nextProfile);
    setInitialProfile(nextProfile);
  }, [user?._id, user?.username, user?.avatarUrl]);

  const isProfileDirty = useMemo(() => {
    if (!initialProfile) return false;
    return profile.username !== initialProfile.username
      || profile.avatarUrl !== initialProfile.avatarUrl;
  }, [profile, initialProfile]);

  const canSaveProfile = isProfileDirty && profile.username.trim();
  const requiresCurrentPassword = user?.authProvider !== 'google';
  const authLabel = user?.authProvider === 'google'
    ? 'Google'
    : user?.authProvider === 'both'
      ? 'Google + Email'
      : 'Email';

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    toast.loading('Uploading profile image...', { id: 'avatarUpload' });
    try {
      const result = await uploadToCloudinary(file);
      setProfile((prev) => ({ ...prev, avatarUrl: result.secure_url }));
      toast.success('Profile image uploaded');
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      toast.dismiss('avatarUpload');
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProfileSave = async () => {
    if (!profile.username.trim()) {
      toast.error('Username is required');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateProfile({
        username: profile.username.trim(),
        avatarUrl: profile.avatarUrl
      });
      updateUser(updated);
      setInitialProfile({
        username: updated.username || '',
        avatarUrl: updated.avatarUrl || ''
      });
      toast.success('Profile updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update profile'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: '' }));
  };

  const handlePasswordSave = async () => {
    if (requiresCurrentPassword && !passwordForm.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const payload = { newPassword: passwordForm.newPassword };
      if (requiresCurrentPassword) {
        payload.currentPassword = passwordForm.currentPassword;
      }
      const result = await changePassword(payload);
      updateUser({ authProvider: result.authProvider });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#6366F1]/15 text-[#6366F1]">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Account Settings</h1>
              <p className="text-[#908FA0] text-sm">Update your username, profile photo, and password.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#C7C4D7] uppercase tracking-widest">
              Auth: {authLabel}
            </span>
            <span className={`px-3 py-1 rounded-full border uppercase tracking-widest ${user.isSuspended ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
              {user.isSuspended ? 'Suspended' : 'Active'}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#908FA0]">
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2FD9F4]" />
            {user.email || 'No email on file'}
          </span>
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#6366F1]" />
            Member since {formatDate(user.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#2FD9F4]/10 text-[#2FD9F4]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profile</h2>
              <p className="text-[#908FA0] text-sm">Change your username and profile picture.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl border border-white/10 bg-[#111827] flex items-center justify-center overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#6366F1]">
                    {(profile.username || 'U').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="btn-secondary px-4 py-2 flex items-center gap-2"
              >
                {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {isUploadingAvatar ? 'Uploading...' : 'Upload photo'}
              </button>
              {profile.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="px-4 py-2 rounded-xl border border-white/10 text-[#908FA0] hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  Remove photo
                </button>
              )}
              <p className="text-xs text-[#908FA0]">JPG or PNG, up to 2MB.</p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7] ml-1">
                  Username
                </label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(event) => setProfile((prev) => ({ ...prev, username: event.target.value }))}
                  className="input-field"
                  placeholder="your-handle"
                />
              </div>
              <div className="text-xs text-[#908FA0]">
                Changes apply across your posts and profile card.
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleProfileSave}
              disabled={!canSaveProfile || isSavingProfile}
              className="btn-primary px-6 py-3 flex items-center gap-2"
            >
              {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSavingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </section>

        <section className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Password</h2>
              <p className="text-[#908FA0] text-sm">Update your login password.</p>
            </div>
          </div>

          <div className="space-y-4">
            {requiresCurrentPassword && (
              <div className="space-y-2">
                <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7] ml-1">
                  Current password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  className="input-field"
                  placeholder="Current password"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7] ml-1">
                New password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                className="input-field"
                placeholder="New password"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#C7C4D7] ml-1">
                Confirm password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={isChangingPassword}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isChangingPassword ? 'Updating...' : 'Update password'}
          </button>
        </section>
      </div>
    </div>
  );
}
