import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await axios.get('/api/profile');
        setProfile(res.data);
      } catch (err) {
        setProfile(null);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="container py-5 text-center">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="container py-5"><div className="alert alert-danger">Profile not found.</div></div>;
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">My Profile</h2>
      <div className="card shadow-sm p-4">
        <div className="d-flex align-items-center mb-3">
          <img src={profile.avatar || '/assets/avatar.png'} alt="avatar" className="rounded-circle me-3" width={64} height={64} />
          <div>
            <h4 className="mb-0">{profile.firstName} {profile.lastName}</h4>
            <div className="text-muted">{profile.email}</div>
          </div>
        </div>
        <div className="mb-2"><strong>Bio:</strong> {profile.bio || 'No bio provided.'}</div>
        <div className="mb-2"><strong>Location:</strong> {profile.location?.address || 'N/A'}</div>
        <div className="mb-2"><strong>Role:</strong> {profile.userType}</div>
      </div>
    </div>
  );
}
