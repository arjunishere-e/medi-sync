import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { firebaseClient } from '../api/firebaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/card";
import { Button } from "../Components/ui/button";
import { Input } from "../Components/ui/input";
import { Label } from "../Components/ui/label";
import { Badge } from "../Components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../Components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Components/ui/tabs";
import { Calendar } from "../Components/ui/calendar";
import { 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Sun,
  Sunset,
  Moon,
  Phone,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

const shiftConfig = {
  morning: { icon: Sun, color: 'bg-amber-100 text-amber-700', time: '06:00 - 14:00' },
  afternoon: { icon: Sunset, color: 'bg-orange-100 text-orange-700', time: '14:00 - 22:00' },
  night: { icon: Moon, color: 'bg-indigo-100 text-indigo-700', time: '22:00 - 06:00' },
  on_call: { icon: Phone, color: 'bg-purple-100 text-purple-700', time: 'On Call' }
};

const roleColors = {
  doctor: 'bg-blue-100 text-blue-700',
  nurse: 'bg-green-100 text-green-700',
  technician: 'bg-amber-100 text-amber-700',
  aide: 'bg-slate-100 text-slate-700'
};

export default function StaffScheduling() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    staff_name: '',
    staff_role: 'nurse',
    ward_id: '',
    shift_type: 'morning',
    shift_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '06:00',
    end_time: '14:00'
  });

  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.StaffSchedule.list('-shift_date', 200)
  });

  const { data: wards = [] } = useQuery({
    queryKey: ['wards'],
    queryFn: () => base44.entities.Ward.list()
  });

  // Fetch staff lists by role for dropdowns
  const { data: doctors = [] } = useQuery({
    queryKey: ['users', 'doctors'],
    queryFn: () => firebaseClient.users.getByRole('doctor')
  });

  const { data: nurses = [] } = useQuery({
    queryKey: ['users', 'nurses'],
    queryFn: () => firebaseClient.users.getByRole('nurse')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setIsDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      staff_name: '',
      staff_role: 'nurse',
      ward_id: '',
      shift_type: 'morning',
      shift_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: '06:00',
      end_time: '14:00'
    });
  };

  const handleShiftChange = (shiftType) => {
    const times = {
      morning: { start: '06:00', end: '14:00' },
      afternoon: { start: '14:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
      on_call: { start: '00:00', end: '23:59' }
    };
    setFormData({
      ...formData,
      shift_type: shiftType,
      start_time: times[shiftType].start,
      end_time: times[shiftType].end
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getSchedulesForDay = (date) => {
    return schedules.filter(s => s.shift_date === format(date, 'yyyy-MM-dd'));
  };

  const stats = {
    total: schedules.filter(s => s.shift_date === format(selectedDate, 'yyyy-MM-dd')).length,
    doctors: schedules.filter(s => s.shift_date === format(selectedDate, 'yyyy-MM-dd') && s.staff_role === 'doctor').length,
    nurses: schedules.filter(s => s.shift_date === format(selectedDate, 'yyyy-MM-dd') && s.staff_role === 'nurse').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Staff Scheduling</h1>
            <p className="text-slate-500 mt-1">Manage shifts and staff allocation</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600">
                <Plus className="h-4 w-4" />
                Add Shift
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Shift</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="staff_name">Staff Member</Label>
                  <Select
                    value={formData.staff_name}
                    onValueChange={(v) => setFormData({ ...formData, staff_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        formData.staff_role === 'doctor' || formData.staff_role === 'nurse'
                          ? `Select ${formData.staff_role}`
                          : 'Type staff name in notes'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.staff_role === 'doctor' ? doctors : formData.staff_role === 'nurse' ? nurses : [])
                        .map((u) => (
                          <SelectItem key={u.id} value={u.name}>
                            {formData.staff_role === 'doctor'
                              ? `${u.name} - ${u.specialization || 'General'}`
                              : u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="staff_role">Role</Label>
                    <Select value={formData.staff_role} onValueChange={(v) => setFormData({ ...formData, staff_role: v, staff_name: '' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="aide">Aide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="ward_id">Ward</Label>
                    <Select value={formData.ward_id} onValueChange={(v) => setFormData({ ...formData, ward_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="shift_date">Date</Label>
                  <Input
                    id="shift_date"
                    type="date"
                    value={formData.shift_date}
                    onChange={(e) => setFormData({ ...formData, shift_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Shift Type</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Object.entries(shiftConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleShiftChange(key)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.shift_type === key 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="h-5 w-5 mx-auto mb-1" />
                          <span className="text-xs capitalize">{key.replace('_', ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Staff on Duty Today</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-600">Doctors</p>
              <p className="text-2xl font-bold text-blue-700">{stats.doctors}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <p className="text-sm text-green-600">Nurses</p>
              <p className="text-2xl font-bold text-green-700">{stats.nurses}</p>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-semibold">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h3>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => {
                const daySchedules = getSchedulesForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isSelected 
                        ? 'bg-blue-500 text-white' 
                        : isToday 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <p className="text-xs font-medium">{format(day, 'EEE')}</p>
                    <p className="text-lg font-bold">{format(day, 'd')}</p>
                    <p className="text-xs mt-1">{daySchedules.length} shifts</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : getSchedulesForDay(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No shifts scheduled for this day</p>
                <Button className="mt-4" onClick={() => {
                  setFormData({ ...formData, shift_date: format(selectedDate, 'yyyy-MM-dd') });
                  setIsDialogOpen(true);
                }}>
                  Add Shift
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {['morning', 'afternoon', 'night', 'on_call'].map(shiftType => {
                  const shiftSchedules = getSchedulesForDay(selectedDate).filter(s => s.shift_type === shiftType);
                  if (shiftSchedules.length === 0) return null;
                  
                  const config = shiftConfig[shiftType];
                  const Icon = config.icon;
                  
                  return (
                    <div key={shiftType}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium capitalize">{shiftType.replace('_', ' ')} Shift</span>
                        <span className="text-sm text-slate-500">{config.time}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {shiftSchedules.map(schedule => {
                          const ward = wards.find(w => w.id === schedule.ward_id);
                          return (
                            <Card key={schedule.id} className="border">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{schedule.staff_name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge className={roleColors[schedule.staff_role]} variant="secondary">
                                        {schedule.staff_role}
                                      </Badge>
                                      {ward && (
                                        <span className="text-xs text-slate-500">{ward.name}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge className={config.color}>
                                    {schedule.start_time} - {schedule.end_time}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
