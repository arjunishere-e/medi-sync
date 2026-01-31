import { firebaseClient } from '../api/firebaseClient';

// Sample doctors to seed into Firestore
const sampleDoctors = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@hospital.com',
    role: 'doctor',
    specialty: 'General Medicine',
    phone: '+91-9876543210',
    experience_years: 12,
  },
  {
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@hospital.com',
    role: 'doctor',
    specialty: 'Cardiology',
    phone: '+91-9876543211',
    experience_years: 8,
  },
  {
    name: 'Dr. Arun Singh',
    email: 'arun.singh@hospital.com',
    role: 'doctor',
    specialty: 'Orthopedics',
    phone: '+91-9876543212',
    experience_years: 15,
  },
  {
    name: 'Dr. Neha Gupta',
    email: 'neha.gupta@hospital.com',
    role: 'doctor',
    specialty: 'Dermatology',
    phone: '+91-9876543213',
    experience_years: 10,
  },
  {
    name: 'Dr. Vikram Patel',
    email: 'vikram.patel@hospital.com',
    role: 'doctor',
    specialty: 'Neurology',
    phone: '+91-9876543214',
    experience_years: 9,
  },
];

export async function seedDoctors() {
  try {
    console.log('🌱 Starting to seed doctors into Firestore...');
    
    // Check if doctors already exist
    const existingDoctors = await firebaseClient.users.getByRole('doctor');
    
    if (existingDoctors && existingDoctors.length > 0) {
      console.log(`✅ Doctors already exist in database (${existingDoctors.length} found). Skipping seed.`);
      return existingDoctors;
    }
    
    // Create doctors if none exist
    const createdDoctors = [];
    for (const doctorData of sampleDoctors) {
      try {
        const doctor = await firebaseClient.users.create(doctorData);
        createdDoctors.push(doctor);
        console.log(`✅ Created doctor: ${doctor.name}`);
      } catch (error) {
        console.error(`❌ Error creating doctor ${doctorData.name}:`, error);
      }
    }
    
    console.log(`✅ Seeded ${createdDoctors.length} doctors successfully`);
    return createdDoctors;
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    return [];
  }
}

export default seedDoctors;
