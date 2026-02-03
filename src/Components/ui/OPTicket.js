import React, { useRef } from 'react';
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Printer, X, FileText, MapPin, Phone, Globe, ClipboardList, Calendar, Clock } from 'lucide-react';

export default function OPTicket({ patient, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>OP Ticket - ${patient.file_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              background: white;
            }
            .ticket {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 30px;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #000;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .hospital-name {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 5px;
            }
            .hospital-subtitle {
              font-size: 14px;
              color: #666;
              margin-bottom: 3px;
            }
            .ticket-title {
              font-size: 20px;
              font-weight: bold;
              margin-top: 15px;
              background: #1e40af;
              color: white;
              padding: 8px;
              letter-spacing: 1px;
            }
            .file-number {
              font-size: 24px;
              font-weight: bold;
              color: #dc2626;
              margin: 20px 0;
              padding: 10px;
              border: 2px dashed #dc2626;
              text-align: center;
              background: #fef2f2;
            }
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px 30px;
              margin: 20px 0;
            }
            .detail-item {
              border-bottom: 1px solid #ddd;
              padding: 8px 0;
            }
            .detail-label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 3px;
            }
            .detail-value {
              font-size: 16px;
              font-weight: 600;
              color: #000;
            }
            .full-width {
              grid-column: 1 / -1;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #000;
              font-size: 11px;
              color: #666;
            }
            .instructions {
              background: #f3f4f6;
              padding: 15px;
              margin: 20px 0;
              border-left: 4px solid #1e40af;
            }
            .instructions-title {
              font-weight: bold;
              margin-bottom: 8px;
              color: #1e40af;
            }
            .instructions-list {
              list-style-position: inside;
              font-size: 12px;
              line-height: 1.6;
            }
            .date-time {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 12px;
            }
            .contact-info {
              display: flex;
              justify-content: center;
              gap: 20px;
              flex-wrap: wrap;
            }
            @media print {
              body {
                padding: 0;
              }
              .ticket {
                border: 2px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Action Buttons */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            OP Ticket Generated
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Ticket
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-8 bg-gray-50">
          <div ref={printRef} className="bg-white">
            <div style={{
              maxWidth: '800px',
              margin: '0 auto',
              border: '2px solid #000',
              padding: '30px',
              backgroundColor: 'white'
            }}>
              {/* Header */}
              <div style={{
                textAlign: 'center',
                borderBottom: '3px double #000',
                paddingBottom: '20px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  marginBottom: '5px'
                }}>MEDISYNC HOSPITAL</div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '3px'
                }}>Multi-Specialty Medical Center</div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '10px'
                }}>Healthcare Excellence Since 1990</div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: '#555',
                  marginTop: '8px'
                }}>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 inline" style={{ display: 'none' }} />
                    <span>📍 123 Medical Avenue, Healthcare District</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 inline" style={{ display: 'none' }} />
                    <span>📞 +91-XXX-XXXX-XXX</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 inline" style={{ display: 'none' }} />
                    <span>🌐 www.medisync.com</span>
                  </div>
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginTop: '15px',
                  background: '#1e40af',
                  color: 'white',
                  padding: '8px',
                  letterSpacing: '1px'
                }}>OUTPATIENT REGISTRATION TICKET</div>
              </div>

              {/* File Number Highlight */}
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#dc2626',
                margin: '20px 0',
                padding: '10px',
                border: '2px dashed #dc2626',
                textAlign: 'center',
                background: '#fef2f2'
              }}>
                FILE NO: {patient.file_number}
              </div>

              {/* Patient Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px 30px',
                margin: '20px 0'
              }}>
                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Patient Name</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000'
                  }}>{patient.full_name}</div>
                </div>

                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Age / Gender</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000'
                  }}>
                    {patient.age} Years / {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Contact Number</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000'
                  }}>{patient.contact_number}</div>
                </div>

                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Registration Date</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000'
                  }}>
                    {formatDate(patient.created_date)}
                  </div>
                </div>

                {patient.ward_id && (
                  <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '3px'
                    }}>Ward</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#000'
                    }}>{patient.ward_id}</div>
                  </div>
                )}

                {patient.bed_number && (
                  <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '3px'
                    }}>Bed Number</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#000'
                    }}>{patient.bed_number}</div>
                  </div>
                )}

                {patient.address && (
                  <div style={{ 
                    gridColumn: '1 / -1',
                    borderBottom: '1px solid #ddd', 
                    padding: '8px 0' 
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '3px'
                    }}>Address</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#000'
                    }}>{patient.address}</div>
                  </div>
                )}

                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Status</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: patient.status === 'critical' ? '#dc2626' : 
                           patient.status === 'recovering' ? '#f59e0b' : '#16a34a'
                  }}>
                    {patient.status ? patient.status.charAt(0).toUpperCase() + patient.status.slice(1) : 'Stable'}
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid #ddd', padding: '8px 0' }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '3px'
                  }}>Registration Time</div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000'
                  }}>
                    {formatTime(patient.created_date)}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                background: '#f3f4f6',
                padding: '15px',
                margin: '20px 0',
                borderLeft: '4px solid #1e40af'
              }}>
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <ClipboardList className="h-4 w-4" />
                  Important Instructions
                </div>
                <ul style={{
                  listStylePosition: 'inside',
                  fontSize: '12px',
                  lineHeight: '1.6'
                }}>
                  <li>Please carry this ticket for all hospital visits</li>
                  <li>Quote your File Number for any medical records or appointments</li>
                  <li>Keep your contact information updated at the reception</li>
                  <li>Follow your doctor's prescribed treatment and schedule</li>
                  <li>For emergencies, contact our 24x7 helpline</li>
                </ul>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '2px solid #000',
                fontSize: '11px',
                color: '#666'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  fontSize: '12px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 inline" />
                    <strong>Printed:</strong> {formatDate(new Date())} 
                    <Clock className="h-3 w-3 inline ml-2" />
                    {formatTime(new Date())}
                  </div>
                  <div>
                    <strong>Valid:</strong> Lifetime
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  fontStyle: 'italic' 
                }}>
                  This is a system generated ticket. Please preserve it for future reference.
                </div>
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '5px', 
                  fontSize: '10px' 
                }}>
                  Powered by MediSync - Integrated Hospital Management System
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
