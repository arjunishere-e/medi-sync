import React from 'react';
import { Heart, Github, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="ml-2 text-lg font-bold text-gray-900">MediSync</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Advanced healthcare management system powered by AI for better patient care and hospital efficiency.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="/" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/patients" className="text-sm text-gray-600 hover:text-gray-900">
                  Patients
                </a>
              </li>
              <li>
                <a href="/staff-scheduling" className="text-sm text-gray-600 hover:text-gray-900">
                  Staff Scheduling
                </a>
              </li>
              <li>
                <a href="/ward-management" className="text-sm text-gray-600 hover:text-gray-900">
                  Ward Management
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Support
            </h3>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2" />
                support@medisync.com
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                1-800-MEDSYNC
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Github className="h-4 w-4 mr-2" />
                GitHub Issues
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} MediSync. All rights reserved. Built with ❤️ for healthcare professionals.
          </p>
        </div>
      </div>
    </footer>
  );
}