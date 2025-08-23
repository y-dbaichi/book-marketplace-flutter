import { useState } from 'react';
import { Container, Row, Col, Card, Alert, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import MapPicker from '../../components/common/MapPicker';

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'customer',
    phone: '',
    firstName: '',
    lastName: '',
    bio: '',
    locationName: '',
    address: '',
    latitude: 33.5731, // Default to Casablanca
    longitude: -7.5898
  });
  const [errors, setErrors] = useState({});

  const { register, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    }));

    // Clear location-related errors
    setErrors(prev => ({
      ...prev,
      address: '',
      latitude: '',
      longitude: ''
    }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      // Step 1: Basic Info
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    } else if (currentStep === 2) {
      // Step 2: Account Security
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.locationName.trim()) {
        newErrors.locationName = 'Location name is required';
      }
    } else if (currentStep === 3) {
      // Step 3: Location (validated by map component)
      if (!formData.address.trim()) {
        newErrors.address = 'Please select a location on the map';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    // Validate all steps
    const newErrors = {};

    // Basic info validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Location validation
    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Please select a location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const userData = {
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType,
        phone: formData.phone.trim(),
        location: {
          name: formData.locationName.trim(),
          coordinates: {
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude)
          },
          address: formData.address.trim()
        },
        profile: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          bio: formData.bio?.trim() || `${formData.userType === 'buyer' ? 'Book seller' : 'Book enthusiast'} from ${formData.locationName}`
        }
      };

      await register(userData);
      navigate('/');
    } catch (err) {
      // Error is handled by context
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Basic Info', icon: 'bi-person' },
      { number: 2, title: 'Account', icon: 'bi-shield-lock' },
      { number: 3, title: 'Location', icon: 'bi-geo-alt' }
    ];

    return (
      <div className="d-flex justify-content-center mb-4">
        {steps.map((step, index) => (
          <div key={step.number} className="d-flex align-items-center">
            <div className={`rounded-circle d-flex align-items-center justify-content-center ${currentStep >= step.number
              ? 'bg-primary text-white'
              : 'bg-light text-muted'
              }`} style={{ width: '50px', height: '50px' }}>
              <i className={step.icon}></i>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-3 ${currentStep > step.number ? 'bg-primary' : 'bg-light'
                }`} style={{ height: '2px', width: '60px' }}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-vh-100" style={{ background: 'var(--primary-gradient)' }}>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="shadow-lg border-0 fade-in-up">
              <Card.Body className="p-5">
                {/* Header */}
                <div className="text-center mb-5">
                  <div className="mb-4">
                    <i className="bi bi-person-plus-fill" style={{
                      fontSize: '4rem',
                      background: 'var(--primary-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}></i>
                  </div>
                  <h1 className="fw-bold mb-2">Join BookMarket</h1>
                  <p className="text-muted fs-5">Create your account to start your book journey</p>
                </div>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {error && (
                  <Alert variant="danger" className="mb-4 border-0 shadow-sm">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="fade-in-up">
                      <div className="text-center mb-4">
                        <h3 className="fw-semibold">Tell us about yourself</h3>
                        <p className="text-muted">Let's start with the basics</p>
                      </div>

                      {/* User Type Selection */}
                      <div className="mb-4">
                        <Form.Label className="fw-semibold mb-3">I want to:</Form.Label>
                        <Row>
                          <Col md={6}>
                            <div className={`card h-100 cursor-pointer border-2 ${formData.userType === 'customer' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
                              }`} onClick={() => setFormData(prev => ({ ...prev, userType: 'customer' }))}>
                              <div className="card-body text-center p-4">
                                <i className="bi bi-bag-heart fs-1 text-primary mb-3"></i>
                                <h5 className="fw-semibold">Buy Books</h5>
                                <p className="text-muted small mb-0">Discover and purchase books from local sellers</p>
                                <Form.Check
                                  type="radio"
                                  name="userType"
                                  value="customer"
                                  checked={formData.userType === 'customer'}
                                  onChange={handleChange}
                                  className="mt-3"
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className={`card h-100 cursor-pointer border-2 ${formData.userType === 'buyer' ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
                              }`} onClick={() => setFormData(prev => ({ ...prev, userType: 'buyer' }))}>
                              <div className="card-body text-center p-4">
                                <i className="bi bi-shop fs-1 text-success mb-3"></i>
                                <h5 className="fw-semibold">Sell Books</h5>
                                <p className="text-muted small mb-0">List and sell your books to book lovers</p>
                                <Form.Check
                                  type="radio"
                                  name="userType"
                                  value="buyer"
                                  checked={formData.userType === 'buyer'}
                                  onChange={handleChange}
                                  className="mt-3"
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Input
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            error={errors.firstName}
                            required
                            placeholder="Enter your first name"
                          />
                        </Col>
                        <Col md={6}>
                          <Input
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            error={errors.lastName}
                            required
                            placeholder="Enter your last name"
                          />
                        </Col>
                      </Row>

                      <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                        placeholder="Enter your email"
                      />

                      <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        required
                        placeholder="+212 6 12 34 56 78"
                      />

                      <div className="d-flex justify-content-end">
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          onClick={nextStep}
                          className="px-5"
                        >
                          Next Step
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Account Security */}
                  {currentStep === 2 && (
                    <div className="fade-in-up">
                      <div className="text-center mb-4">
                        <h3 className="fw-semibold">Secure your account</h3>
                        <p className="text-muted">Create a strong password and set your location</p>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            required
                            placeholder="Enter your password"
                          />
                        </Col>
                        <Col md={6}>
                          <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            required
                            placeholder="Confirm your password"
                          />
                        </Col>
                      </Row>

                      <Input
                        label={formData.userType === 'buyer' ? 'Store/Business Name' : 'Location Name'}
                        name="locationName"
                        value={formData.locationName}
                        onChange={handleChange}
                        error={errors.locationName}
                        required
                        placeholder={formData.userType === 'buyer' ? 'My Bookstore' : 'My Location'}
                      />

                      <Input
                        label="Bio (Optional)"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                        helperText="A brief description about yourself"
                      />

                      <div className="d-flex justify-content-between">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={prevStep}
                          className="px-5"
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Back
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          onClick={nextStep}
                          className="px-5"
                        >
                          Next Step
                          <i className="bi bi-arrow-right ms-2"></i>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Location Selection */}
                  {currentStep === 3 && (
                    <div className="fade-in-up">
                      <div className="text-center mb-4">
                        <h3 className="fw-semibold">Where can people find you?</h3>
                        <p className="text-muted">Pin your exact location on the map</p>
                      </div>

                      <MapPicker
                        onLocationSelect={handleLocationSelect}
                        initialPosition={[formData.latitude, formData.longitude]}
                        initialAddress={formData.address}
                      />

                      {errors.address && (
                        <Alert variant="danger" className="mt-3">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          {errors.address}
                        </Alert>
                      )}

                      <div className="d-flex justify-content-between mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={prevStep}
                          className="px-5"
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Back
                        </Button>
                        <Button
                          type="submit"
                          variant="success"
                          size="lg"
                          loading={isLoading}
                          disabled={isLoading}
                          className="px-5"
                        >
                          {isLoading ? (
                            <>
                              <span className="loading-spinner me-2"></span>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-2"></i>
                              Create Account
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>

                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-semibold">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
