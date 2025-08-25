import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../components/common/Button';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const res = await axios.get('/api/settings');
        setSettings(res.data);
      } catch (err) {
        setSettings(null);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await axios.put('/api/settings', settings);
      setSuccess(true);
    } catch (err) {
      setSuccess(false);
    }
  };

  if (loading) {
    return <div className="container py-5 text-center">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="container py-5"><div className="alert alert-danger">Settings not found.</div></div>;
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Settings</h2>
      <form onSubmit={handleSave} className="card shadow-sm p-4">
        {/* Example setting: notification preference */}
        <div className="mb-3">
          <label className="form-label">Email Notifications</label>
          <select className="form-select" value={settings.emailNotifications} onChange={e => setSettings(s => ({ ...s, emailNotifications: e.target.value }))}>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        <Button type="submit" variant="primary">Save Changes</Button>
        {success && <div className="alert alert-success mt-3">Settings saved!</div>}
      </form>
    </div>
  );
}
