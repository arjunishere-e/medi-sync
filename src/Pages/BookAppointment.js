import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firebaseClient } from '../api/firebaseClient';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Badge } from "../Components/ui/badge";
import seedDoctors from '../utils/seedDoctors';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import { format, addDays, parse, addMinutes } from 'date-fns';

export default function BookAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch all doctors/staff
  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: async () => {
      try {
        console.log('📥 Fetching doctors from Firestore...');
        // Try to fetch doctors by role
        const allDoctors = await firebaseClient.users.getByRole('doctor');
        console.log('✅ Doctors fetched:', allDoctors);
        return allDoctors;
      } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all appointments
  const { data: allAppointments = [] } = useQuery({
    queryKey: ['all-appointments'],
    queryFn: async () => {
      try {
        const appointments = await firebaseClient.appointments?.list?.('-booking_date', 200) || [];
        return appointments;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
    }
  });

  // Generate available time slots (9 AM to 5 PM, 15-minute slots)
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !selectedDoctor) return [];

    const slots = [];
    const dayStart = 9 * 60; // 9 AM in minutes
    const dayEnd = 17 * 60; // 5 PM in minutes

    for (let minutes = dayStart; minutes < dayEnd; minutes += 15) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      // Check if this slot is already booked
      const isBooked = allAppointments.some(apt => {
        return (
          apt.doctor_id === selectedDoctor.id &&
          apt.appointment_date === selectedDate &&
          apt.appointment_time === timeStr &&
          apt.status !== 'cancelled'
        );
      });

      slots.push({
        time: timeStr,
        isAvailable: !isBooked
      });
    }

    return slots;
  }, [selectedDate, selectedDoctor, allAppointments]);

  // Get next available token number for selected date
  const getNextTokenNumber = (date) => {
    const appointmentsOnDate = allAppointments.filter(
      apt => apt.appointment_date === date && apt.status !== 'cancelled'
    );
    return appointmentsOnDate.length + 1;
  };

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctor || !selectedDate || !selectedTime || !user?.patient_doc_id) {
        throw new Error('Missing required information');
      }

      const tokenNumber = getNextTokenNumber(selectedDate);
      const endTime = addMinutes(
        parse(selectedTime, 'HH:mm', new Date()),
        15
      );

      const appointment = {
        patient_id: user.patient_doc_id,
        patient_name: user.name,
        patient_file_number: user.file_number,
        patient_contact: '',
        doctor_id: selectedDoctor.id,
        doctor_name: selectedDoctor.name,
        doctor_specialty: selectedDoctor.specialty || selectedDoctor.specialization || 'General',
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        appointment_end_time: format(endTime, 'HH:mm'),
        token_number: tokenNumber,
        status: 'booked',
        booking_date: new Date().toISOString(),
        notes: ''
      };

      console.log('📅 Booking appointment:', appointment);
      const result = await firebaseClient.appointments?.create?.(appointment);
      return result;
    },
    onSuccess: (result) => {
      console.log('✅ Appointment booked successfully!', result);
      setBookedAppointment(result);
      setShowReceipt(true);
      queryClient.invalidateQueries({ queryKey: ['all-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (error) => {
      console.error('❌ Error booking appointment:', error);
      alert('Error booking appointment: ' + error.message);
    }
  });

  // Get available dates (next 30 days)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = addDays(new Date(), i);
      dates.push(format(date, 'yyyy-MM-dd'));
    }
    return dates;
  }, []);

  const handleBooking = () => {
    bookAppointmentMutation.mutate();
  };

  const downloadReceipt = () => {
    if (!bookedAppointment) return;

    const receiptContent = `
APPOINTMENT BOOKING RECEIPT
========================================
Generated: ${new Date().toLocaleString()}

PATIENT INFORMATION
Name: ${bookedAppointment.patient_name}
File Number: ${bookedAppointment.patient_file_number}
Contact: ${bookedAppointment.patient_contact || 'N/A'}

DOCTOR INFORMATION
Doctor: ${bookedAppointment.doctor_name}
Specialty: ${bookedAppointment.doctor_specialty}

APPOINTMENT DETAILS
Date: ${format(new Date(bookedAppointment.appointment_date), 'MMMM dd, yyyy')}
Time: ${bookedAppointment.appointment_time} - ${bookedAppointment.appointment_end_time}
Token Number: ${bookedAppointment.token_number}
Status: ${bookedAppointment.status}

Booking ID: ${bookedAppointment.id}
========================================
Please arrive 5 minutes before your appointment time.
For cancellations, please notify 24 hours in advance.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment_${bookedAppointment.appointment_date}_token${bookedAppointment.token_number}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (showReceipt && bookedAppointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <CardTitle className="text-2xl flex items-center gap-3">
                <CheckCircle className="h-8 w-8" />
                Appointment Booked Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* Confirmation Message */}
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-green-800 font-semibold text-lg">
                    ✓ Your appointment has been confirmed
                  </p>
                  <p className="text-green-700 text-sm mt-2">
                    A token number has been assigned for quick check-in
                  </p>
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patient Info */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Your Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-slate-600">Name</p>
                        <p className="font-semibold text-slate-900">{bookedAppointment.patient_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">File Number</p>
                        <p className="font-mono font-bold text-blue-700">{bookedAppointment.patient_file_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      Doctor Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-slate-600">Doctor</p>
                        <p className="font-semibold text-slate-900">{bookedAppointment.doctor_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Specialty</p>
                        <p className="font-semibold text-slate-900">{bookedAppointment.doctor_specialty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="p-4 bg-blue-50 rounded-lg md:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Appointment Schedule
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm">Date</p>
                        <p className="font-bold text-lg text-slate-900">
                          {format(new Date(bookedAppointment.appointment_date), 'MMM dd')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Time</p>
                        <p className="font-bold text-lg text-slate-900">
                          {bookedAppointment.appointment_time}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Token #</p>
                        <p className="font-bold text-2xl text-green-600">
                          {bookedAppointment.token_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={downloadReceipt}
                    className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="h-4 w-4" />
                    Download Receipt
                  </Button>
                  <Button
                    onClick={() => navigate('/patient-dashboard')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/patient-dashboard')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Book an Appointment</h1>
          <p className="text-slate-500 mt-2">Select a doctor and available time slot</p>
        </div>

        {/* Step 1: Select Doctor */}
        <Card className="mb-6 border-2 border-slate-300">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Step 1: Select a Doctor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <p className="text-slate-600 mb-4">No doctors available in the system</p>
                  <Button
                    onClick={async () => {
                      try {
                        await seedDoctors();
                        queryClient.invalidateQueries({ queryKey: ['all-doctors'] });
                      } catch (error) {
                        console.error('Error seeding doctors:', error);
                      }
                    }}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Sample Doctors
                  </Button>
                </div>
              ) : (
                doctors.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 bg-white hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{doctor.name}</p>
                    <p className="text-sm text-slate-600">{doctor.specialty || doctor.specialization || doctor.speciality || 'General Medicine'}</p>
                    {selectedDoctor?.id === doctor.id && (
                      <Badge className="mt-2 bg-blue-600">Selected</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDoctor && (
          <>
            {/* Step 2: Select Date */}
            <Card className="mb-6 border-2 border-slate-300">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Step 2: Select Date
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {availableDates.map(date => (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        selectedDate === date
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-slate-300 bg-white hover:border-blue-300 text-slate-900'
                      }`}
                    >
                      {format(new Date(date), 'MMM dd')}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedDate && (
              <>
                {/* Step 3: Select Time */}
                <Card className="mb-6 border-2 border-slate-300">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Step 3: Select Time (15-minute slots)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {availableTimeSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => {
                            if (!slot.isAvailable) {
                              alert('This slot is already booked. Please choose a different time.');
                              return;
                            }
                            setSelectedTime(slot.time);
                          }}
                          aria-disabled={!slot.isAvailable}
                          className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                            !slot.isAvailable
                              ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed'
                              : selectedTime === slot.time
                              ? 'border-green-500 bg-green-50 text-green-900'
                              : 'border-slate-300 bg-white hover:border-green-300 text-slate-900'
                          }`}
                          title={!slot.isAvailable ? 'Booked slot' : 'Select time'}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    {availableTimeSlots.every(s => !s.isAvailable) && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <p className="text-yellow-800">No available slots for this date</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Confirmation */}
                {selectedTime && (
                  <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600">Doctor</p>
                            <p className="font-bold text-slate-900">{selectedDoctor.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Date</p>
                            <p className="font-bold text-slate-900">
                              {format(new Date(selectedDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Time</p>
                            <p className="font-bold text-slate-900">
                              {selectedTime} - {format(addMinutes(parse(selectedTime, 'HH:mm', new Date()), 15), 'HH:mm')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Token Number</p>
                            <p className="font-bold text-green-600 text-lg">
                              {getNextTokenNumber(selectedDate)}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={handleBooking}
                          disabled={bookAppointmentMutation.isPending}
                          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                        >
                          <CheckCircle className="h-5 w-5" />
                          {bookAppointmentMutation.isPending ? 'Booking...' : 'Confirm Appointment'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
