import { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const { login, error, isLoading, clearError } = useAuth();
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      await login(formData);
      navigate('/');
    } catch (err) {
      // Error is handled by context
    }
  };

  return (
    <div className="min-vh-100" style={{ background: 'var(--primary-gradient)' }}>
      <Container className="py-5">
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col md={6} lg={5} xl={4}>
            <Card className="shadow-lg border-0 fade-in-up">
              <Card.Body className="p-5">
                <div className="text-center mb-5">
                  <div className="mb-4">
                    <i className="bi bi-book-half" style={{
                      fontSize: '4rem',
                      background: 'var(--primary-gradient)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}></i>
                  </div>
                  <h1 className="fw-bold mb-2">Welcome Back</h1>
                  <p className="text-muted fs-5">Sign in to your BookMarket account</p>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4 border-0 shadow-sm">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
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
                    label="Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    placeholder="Enter your password"
                  />

                  <div className="d-grid mb-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      disabled={isLoading}
                      className="py-3"
                    >
                      {isLoading ? (
                        <>
                          <span className="loading-spinner me-2"></span>
                          Signing In...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-semibold">
                      Sign up here
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
