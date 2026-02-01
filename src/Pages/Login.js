import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Stethoscope, Mail, Lock, User, ArrowRight, Briefcase, Stethoscope as DoctorIcon, UserCircle } from 'lucide-react';

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    fileNumber: '',
    age: '',
    mobile: '',
    specialization: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login, signup } = useAuth();

  const roles = [
    {
      id: 'nurse',
      name: 'Nurse',
      description: 'Ward Management',
      icon: Briefcase
    },
    {
      id: 'doctor',
      name: 'Doctor',
      description: 'Patient Consultations',
      icon: DoctorIcon
    },
    {
      id: 'office',
      name: 'Office',
      description: 'Hospital Operations',
      icon: Briefcase
    },
    {
      id: 'patient',
      name: 'Patient',
      description: 'Health Monitoring',
      icon: UserCircle
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // For patient login (not signup), only need file number
    if (!isSignup && selectedRole === 'patient') {
      if (!formData.fileNumber) newErrors.fileNumber = 'File Number is required';
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (isSignup) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (selectedRole === 'doctor' && !formData.specialization) {
        newErrors.specialization = 'Specialization is required for doctors';
      }
      // For patient signup - require file number
      if (selectedRole === 'patient') {
        if (!formData.fileNumber) newErrors.fileNumber = 'File Number is required for patient registration';
        if (!formData.age) newErrors.age = 'Age is required for patient registration';
        if (!formData.mobile) newErrors.mobile = 'Mobile number is required for patient registration';
        if (formData.mobile && formData.mobile.length < 10) newErrors.mobile = 'Please enter a valid mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRole) {
      setErrors({ role: 'Please select a role' });
      return;
    }

    if (!validateForm()) return;

    try {
      if (isSignup) {
        await signup(
          formData.name,
          formData.email,
          formData.password,
          selectedRole,
          selectedRole === 'patient'
            ? { age: formData.age, mobile: formData.mobile, file_number: formData.fileNumber }
            : { specialization: formData.specialization }
        );
      } else {
        // For patient login, use fileNumber
        if (selectedRole === 'patient') {
          await login(formData.fileNumber, null, selectedRole);
        } else {
          await login(formData.email, formData.password, selectedRole);
        }
      }

      // Role-based redirect
      const dashboards = {
        doctor: '/doctor-dashboard',
        nurse: '/',
        office: '/office-dashboard',
        patient: '/patient-dashboard'
      };
      navigate(dashboards[selectedRole] || '/', { replace: true });
    } catch (error) {
      setErrors({ submit: error.message || 'An error occurred. Please try again.' });
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">MediSync</h1>
          </div>
          <p className="text-slate-600 text-lg">Healthcare Management System</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Selection */}
          <div className="lg:col-span-1">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Your Role</h2>
              {roles.map(role => {
                const IconComponent = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      setErrors({});
                    }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <IconComponent className="h-6 w-6 mb-2 text-blue-600" />
                        <h3 className="font-semibold text-slate-900">{role.name}</h3>
                        <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                      </div>
                      {selectedRole === role.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {errors.role && <p className="text-red-500 text-sm mt-2">{errors.role}</p>}
            </div>
          </div>

          {/* Login/Signup Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-slate-300">
              <CardHeader>
                <CardTitle className="text-slate-900 text-2xl">
                  {isSignup ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* File Number field (patient login or signup) */}
                  {selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">File Number (Patient ID)</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="fileNumber"
                          placeholder="Enter your file number (e.g., PAT-001)"
                          value={formData.fileNumber}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.fileNumber && <p className="text-red-500 text-sm mt-1">{errors.fileNumber}</p>}
                    </div>
                  )}

                  {/* Name field (signup only, non-patient) */}
                  {isSignup && selectedRole !== 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                  )}

                  {/* Name field (signup for patient) */}
                  {isSignup && selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                  )}

                  {/* Email field (non-patient users only) */}
                  {selectedRole !== 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                  )}

                  {/* Specialization (doctor signup only) */}
                  {isSignup && selectedRole === 'doctor' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Specialization</Label>
                      <Input
                        name="specialization"
                        placeholder="e.g., Cardiology, Orthopedics, General"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                      />
                      {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
                    </div>
                  )}

                  {/* Password field (non-patient users only) */}
                  {selectedRole !== 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                  )}

                  {/* Confirm Password field (non-patient signup only) */}
                  {isSignup && selectedRole !== 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {/* Age field (patient signup only) */}
                  {isSignup && selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Age *</Label>
                      <Input
                        name="age"
                        type="number"
                        placeholder="Enter your age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                      />
                      {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
                    </div>
                  )}

                  {/* Mobile field (patient signup only) */}
                  {isSignup && selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Mobile Number *</Label>
                      <Input
                        name="mobile"
                        type="tel"
                        placeholder="Enter your mobile number"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                      />
                      {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
                    </div>
                  )}

                  {/* Password field (patient signup only for verification) */}
                  {isSignup && selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Password (for verification)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>
                  )}

                  {/* Confirm Password field (patient signup only) */}
                  {isSignup && selectedRole === 'patient' && (
                    <div>
                      <Label className="text-slate-700 mb-2 block">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10 bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                      <p className="text-red-600 text-sm">{errors.submit}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={selectedRole === 'patient' 
                      ? (!selectedRole || !formData.fileNumber)
                      : (!selectedRole || (isSignup && !formData.name) || !formData.email || !formData.password)
                    }
                    className={`w-full text-white font-semibold py-2 gap-2 mt-6 transition-all ${
                      (selectedRole === 'patient' 
                        ? (!selectedRole || !formData.fileNumber)
                        : (!selectedRole || (isSignup && !formData.name) || !formData.email || !formData.password))
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {isSignup ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <div className="text-center pt-4 border-t border-slate-300">
                    <p className="text-slate-600 text-sm">
                      {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignup(!isSignup);
                          setErrors({});
                          setFormData({
                            name: '',
                            email: '',
                            password: '',
                            confirmPassword: ''
                          });
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        {isSignup ? 'Sign In' : 'Sign Up'}
                      </button>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
