import { useState } from 'react';
import { Container, Row, Col, Card, Badge, Modal as BootstrapModal, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import MapPicker from '../../components/common/MapPicker';
import Swal from 'sweetalert2';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    bio: user?.profile?.bio || '',
    phone: user?.phone || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Location state
  const [location, setLocation] = useState(user?.location || null);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        profile: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          bio: profileForm.bio
        },
        phone: profileForm.phone
      });

      setShowEditModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile has been updated successfully!',
        confirmButtonColor: '#667eea'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Passwords do not match',
        text: 'Please ensure your new password and confirmation match',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Password too short',
        text: 'Password must be at least 6 characters long',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    setLoading(true);

    try {
      await updateProfile({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been changed successfully!',
        confirmButtonColor: '#667eea'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update password',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    if (!location) {
      Swal.fire({
        icon: 'warning',
        title: 'No Location Selected',
        text: 'Please select a location on the map',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    setLoading(true);

    try {
      await updateProfile({ location });

      setShowLocationModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Location Updated',
        text: 'Your location has been updated successfully!',
        confirmButtonColor: '#667eea'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update location',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setProfileForm({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      phone: user?.phone || ''
    });
    setShowEditModal(true);
  };

  if (!user) {
    return (
      <Container className="py-5">
        <Card className="text-center p-5">
          <i className="bi bi-person-slash fs-1 text-muted mb-3"></i>
          <h3 className="text-muted">Not Logged In</h3>
          <p className="text-muted mb-4">Please log in to view your profile</p>
          <Button variant="primary" onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </Card>
      </Container>
    );
  }

  const displayName = user.profile?.firstName && user.profile?.lastName
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.email.split('@')[0];

  return (
    <Container className="py-4" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div className="mb-4">
        <h1 className="mb-1">
          <i className="bi bi-person-circle me-2 text-primary"></i>
          My Profile
        </h1>
        <p className="text-muted mb-0">Manage your account settings and personal information</p>
      </div>

      <Row className="g-4">
        {/* Main Profile Card */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="text-center">
              {/* Avatar */}
              <div className="mb-4">
                <div
                  className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center"
                  style={{ width: '120px', height: '120px' }}
                >
                  <i className="bi bi-person-fill text-primary" style={{ fontSize: '4rem' }}></i>
                </div>
              </div>

              {/* Name */}
              <h3 className="fw-bold mb-2">{displayName}</h3>
              <p className="text-muted mb-3">
                <i className="bi bi-envelope me-2"></i>
                {user.email}
              </p>

              {/* User Type Badge */}
              <Badge
                bg={user.userType === 'seller' ? 'primary' : 'success'}
                className="mb-4 py-2 px-4 fs-6 text-capitalize"
              >
                <i className={`bi ${user.userType === 'seller' ? 'bi-shop' : 'bi-cart'} me-2`}></i>
                {user.userType}
              </Badge>

              {/* Bio */}
              {user.profile?.bio && (
                <div className="bg-light rounded p-3 mb-4 text-start">
                  <small className="text-muted d-block mb-1">
                    <i className="bi bi-quote me-1"></i>
                    Bio
                  </small>
                  <p className="mb-0 small">{user.profile.bio}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="d-grid gap-2">
                <Button variant="primary" onClick={openEditModal}>
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Profile
                </Button>
                <Button variant="outline-primary" onClick={() => setShowPasswordModal(true)}>
                  <i className="bi bi-key me-2"></i>
                  Change Password
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Details Section */}
        <Col lg={8}>
          <Row className="g-4">
            {/* Contact Information */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      <i className="bi bi-telephone me-2 text-primary"></i>
                      Contact Information
                    </h5>
                    <Button variant="outline-secondary" size="sm" onClick={openEditModal}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </div>

                  <Row className="g-3">
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Email Address</small>
                        <div className="fw-semibold">
                          <i className="bi bi-envelope me-2 text-primary"></i>
                          {user.email}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Phone Number</small>
                        <div className="fw-semibold">
                          <i className="bi bi-phone me-2 text-primary"></i>
                          {user.phone || 'Not provided'}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">First Name</small>
                        <div className="fw-semibold">
                          <i className="bi bi-person me-2 text-primary"></i>
                          {user.profile?.firstName || 'Not provided'}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Last Name</small>
                        <div className="fw-semibold">
                          <i className="bi bi-person me-2 text-primary"></i>
                          {user.profile?.lastName || 'Not provided'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Location Information */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      <i className="bi bi-geo-alt me-2 text-primary"></i>
                      Location
                    </h5>
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowLocationModal(true)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                  </div>

                  {user.location ? (
                    <Row className="g-3">
                      <Col md={6}>
                        <div className="bg-light rounded p-3">
                          <small className="text-muted d-block mb-1">Location Name</small>
                          <div className="fw-semibold">
                            <i className="bi bi-pin-map me-2 text-primary"></i>
                            {user.location.name}
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="bg-light rounded p-3">
                          <small className="text-muted d-block mb-1">Address</small>
                          <div className="fw-semibold">
                            <i className="bi bi-house me-2 text-primary"></i>
                            {user.location.address}
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="bg-light rounded p-3">
                          <small className="text-muted d-block mb-1">Coordinates</small>
                          <div className="fw-semibold small">
                            <i className="bi bi-globe me-2 text-primary"></i>
                            {user.location.coordinates.latitude.toFixed(6)}, {user.location.coordinates.longitude.toFixed(6)}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-geo-alt-fill fs-1 text-muted mb-3"></i>
                      <p className="text-muted mb-3">No location set</p>
                      <Button variant="primary" onClick={() => setShowLocationModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i>
                        Add Location
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Account Information */}
            <Col xs={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    Account Information
                  </h5>

                  <Row className="g-3">
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Account Type</small>
                        <div className="fw-semibold text-capitalize">
                          <i className={`bi ${user.userType === 'seller' ? 'bi-shop' : 'bi-cart'} me-2 text-primary`}></i>
                          {user.userType}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Account Status</small>
                        <div className="fw-semibold">
                          <i className={`bi ${user.isActive ? 'bi-check-circle' : 'bi-x-circle'} me-2 ${user.isActive ? 'text-success' : 'text-danger'}`}></i>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Member Since</small>
                        <div className="fw-semibold">
                          <i className="bi bi-calendar-check me-2 text-primary"></i>
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="bg-light rounded p-3">
                        <small className="text-muted d-block mb-1">Last Login</small>
                        <div className="fw-semibold">
                          <i className="bi bi-clock-history me-2 text-primary"></i>
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Never'
                          }
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <BootstrapModal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
        <BootstrapModal.Header closeButton className="border-0">
          <BootstrapModal.Title>
            <i className="bi bi-pencil-square me-2 text-primary"></i>
            Edit Profile
          </BootstrapModal.Title>
        </BootstrapModal.Header>
        <Form onSubmit={handleUpdateProfile}>
          <BootstrapModal.Body className="px-4">
            <Row>
              <Col md={6}>
                <Input
                  label="First Name"
                  name="firstName"
                  value={profileForm.firstName}
                  onChange={handleProfileChange}
                  placeholder="Enter your first name"
                />
              </Col>
              <Col md={6}>
                <Input
                  label="Last Name"
                  name="lastName"
                  value={profileForm.lastName}
                  onChange={handleProfileChange}
                  placeholder="Enter your last name"
                />
              </Col>
            </Row>

            <Input
              label="Phone Number"
              name="phone"
              value={profileForm.phone}
              onChange={handleProfileChange}
              placeholder="Enter your phone number"
              required
            />

            <div className="mb-3">
              <label className="form-label">Bio</label>
              <textarea
                className="form-control"
                name="bio"
                value={profileForm.bio}
                onChange={handleProfileChange}
                rows={4}
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <small className="text-muted">{profileForm.bio.length}/500 characters</small>
            </div>
          </BootstrapModal.Body>
          <BootstrapModal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              <i className="bi bi-check-circle me-2"></i>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </BootstrapModal.Footer>
        </Form>
      </BootstrapModal>

      {/* Change Password Modal */}
      <BootstrapModal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <BootstrapModal.Header closeButton className="border-0">
          <BootstrapModal.Title>
            <i className="bi bi-key me-2 text-primary"></i>
            Change Password
          </BootstrapModal.Title>
        </BootstrapModal.Header>
        <Form onSubmit={handleUpdatePassword}>
          <BootstrapModal.Body className="px-4">
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
              required
            />

            <Input
              label="New Password"
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirm new password"
              required
            />

            <div className="alert alert-info border-0 d-flex align-items-start">
              <i className="bi bi-info-circle me-2 mt-1"></i>
              <small>Password must be at least 6 characters long</small>
            </div>
          </BootstrapModal.Body>
          <BootstrapModal.Footer className="border-0">
            <Button variant="outline-secondary" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              <i className="bi bi-check-circle me-2"></i>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </BootstrapModal.Footer>
        </Form>
      </BootstrapModal>

      {/* Update Location Modal */}
      <BootstrapModal show={showLocationModal} onHide={() => setShowLocationModal(false)} size="lg" centered>
        <BootstrapModal.Header closeButton className="border-0">
          <BootstrapModal.Title>
            <i className="bi bi-geo-alt me-2 text-primary"></i>
            Update Location
          </BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body className="px-4">
          <p className="text-muted mb-3">
            <i className="bi bi-info-circle me-2"></i>
            Click on the map to select your location
          </p>
          <MapPicker
            initialPosition={
              user.location?.coordinates
                ? [user.location.coordinates.latitude, user.location.coordinates.longitude]
                : [33.5731, -7.5898]
            }
            initialAddress={user.location?.address || ''}
            onLocationSelect={setLocation}
          />
        </BootstrapModal.Body>
        <BootstrapModal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowLocationModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateLocation} loading={loading} disabled={loading}>
            <i className="bi bi-check-circle me-2"></i>
            {loading ? 'Updating...' : 'Update Location'}
          </Button>
        </BootstrapModal.Footer>
      </BootstrapModal>
    </Container>
  );
}
