from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@healthforesight.com")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "HealthForesight")

async def send_email(to_email: str, subject: str, html_content: str):
    """
    Send email via SendGrid.
    Returns True if successful, False otherwise.
    """
    if not SENDGRID_API_KEY:
        print("⚠️ SendGrid API key not configured. Falling back to console logging.")
        print(f"\n📧 === EMAIL (Not Sent) ===")
        print(f"From: {SENDGRID_FROM_EMAIL}")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"=========================\n")
        return False
    
    try:
        message = Mail(
            from_email=(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME),
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code == 202:
            print(f"✅ Email sent successfully to {to_email}")
            return True
        else:
            print(f"⚠️ Email send returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return False

# Email Templates - Professional & Modern Design

def _email_header():
    """Professional email header with branding"""
    return """
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">🏥 HealthForesight</h1>
        <p style="color: #f0e7ff; margin: 5px 0 0 0; font-size: 14px;">Your Partner in Healthcare Excellence</p>
    </div>
    """

def _email_footer():
    """Professional email footer"""
    return """
    <div style="background-color: #f8fafc; padding: 25px; margin-top: 30px; border-top: 3px solid #667eea; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px; text-align: center;">
            <strong>HealthForesight Platform</strong><br>
            Advanced Healthcare Management System
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
            📧 support@healthforesight.com | 📞 +1 (555) 123-4567<br>
            © 2024 HealthForesight. All rights reserved.
        </p>
    </div>
    """

def appointment_confirmation_email(patient_name: str, doctor_name: str, appointment_date: str):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #166534; margin: 0; font-size: 20px;">✅ Appointment Confirmed</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Your appointment has been successfully confirmed. We're looking forward to seeing you!
                </p>
                
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                    <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">APPOINTMENT DETAILS</p>
                    <p style="color: white; margin: 0; font-size: 18px; font-weight: 600;">👨‍⚕️ Dr. {doctor_name}</p>
                    <p style="color: #e0e7ff; margin: 15px 0 0 0; font-size: 22px; font-weight: 700;">📅 {appointment_date}</p>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        ⏰ <strong>Important:</strong> Please arrive 15 minutes early to complete check-in procedures.
                    </p>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;"><strong>What to bring:</strong></p>
                    <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px;">
                        <li>Valid photo ID</li>
                        <li>Insurance card</li>
                        <li>List of current medications</li>
                        <li>Any relevant medical records</li>
                    </ul>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """

def lab_results_notification(patient_name: str):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #075985; margin: 0; font-size: 20px;">📊 Lab Results Available</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Your recent lab test results are now available in your patient portal.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://portal.healthforesight.com/lab-results" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        View Lab Results →
                    </a>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 25px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.6;">
                        💡 <strong>Next Steps:</strong><br>
                        • Review your results in the patient portal<br>
                        • Schedule a follow-up consultation if needed<br>
                        • Contact your doctor with any questions
                    </p>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """

def prescription_ready_email(patient_name: str, medication: str):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #6b21a8; margin: 0; font-size: 20px;">💊 Prescription Ready</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Your prescription has been issued and is ready for pickup or delivery.
                </p>
                
                <div style="background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                    <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">MEDICATION</p>
                    <p style="color: white; margin: 0; font-size: 24px; font-weight: 700;">💊 {medication}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://portal.healthforesight.com/prescriptions" style="background-color: #8b5cf6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                        View Prescription Details
                    </a>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong>⚕️ Important:</strong> Follow dosage instructions carefully. Contact your doctor if you experience any side effects.
                    </p>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """

def send_telemedicine_invite(patient_name: str, meet_url: str, appointment_date: str):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #ecfeff; border-left: 4px solid #06b6d4; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #0e7490; margin: 0; font-size: 20px;">🎥 Virtual Consultation Ready</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    Your telemedicine appointment is confirmed. Join your virtual consultation using the link below.
                </p>
                
                <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                    <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">APPOINTMENT TIME</p>
                    <p style="color: white; margin: 0; font-size: 22px; font-weight: 700;">📅 {appointment_date}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{meet_url}" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 18px 45px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 17px; display: inline-block; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);">
                        🎥 Join Video Call
                    </a>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center;">
                    <p style="color: #64748b; margin: 0 0 10px 0; font-size: 13px;">Or copy this link:</p>
                    <p style="color: #0891b2; margin: 0; font-size: 13px; word-break: break-all; font-family: monospace;">{meet_url}</p>
                </div>
                
                <div style="margin-top: 25px; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
                    <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0;"><strong>📝 Preparation Tips:</strong></p>
                    <ul style="color: #92400e; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Test your camera and microphone beforehand</li>
                        <li>Find a quiet, well-lit location</li>
                        <li>Have your medical history and medications list ready</li>
                        <li>Join 5 minutes early</li>
                    </ul>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """

def send_critical_lab_alert(patient_name: str, lab_type: str, value: float):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #991b1b; margin: 0; font-size: 20px;">⚠️ URGENT: Critical Lab Result</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #dc2626; font-size: 15px; line-height: 1.6; font-weight: 600;">
                    ⚠️ This is an urgent notification regarding your recent lab test results.
                </p>
                
                <div style="background-color: #fee2e2; border: 2px solid #dc2626; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                    <p style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">CRITICAL VALUE DETECTED</p>
                    <p style="color: #7f1d1d; margin: 0 0 15px 0; font-size: 16px; font-weight: 600;">{lab_type}</p>
                    <p style="color: #dc2626; margin: 0; font-size: 32px; font-weight: 700;">{value}</p>
                </div>
                
                <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="color: #92400e; margin: 0 0 15px 0; font-size: 15px; font-weight: 700;">🚨 IMMEDIATE ACTION REQUIRED:</p>
                    <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li><strong>Contact your doctor immediately</strong></li>
                        <li>Visit the emergency department if experiencing symptoms</li>
                        <li>Do not delay seeking medical attention</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="tel:+15551234567" style="background-color: #dc2626; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; margin-right: 10px;">
                        📞 Call Doctor
                    </a>
                    <a href="https://portal.healthforesight.com/emergency" style="background-color: #f59e0b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                        🏥 Find ER
                    </a>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """

def medication_reminder_email(patient_name: str, medication: str, time: str):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
            {_email_header()}
            
            <div style="padding: 40px 30px;">
                <div style="background-color: #fef9c3; border-left: 4px solid #eab308; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
                    <h2 style="color: #854d0e; margin: 0; font-size: 20px;">💊 Medication Reminder</h2>
                </div>
                
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                    This is a friendly reminder to take your scheduled medication.
                </p>
                
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center;">
                    <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">MEDICATION</p>
                    <p style="color: white; margin: 0 0 15px 0; font-size: 22px; font-weight: 700;">{medication}</p>
                    <p style="color: #fef3c7; margin: 0; font-size: 18px; font-weight: 600;">⏰ {time}</p>
                </div>
                
                <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                        💡 <strong>Tip:</strong> Take with food if prescribed. Set this email as a reminder for tomorrow's dose!
                    </p>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <a href="https://portal.healthforesight.com/medications" style="background-color: #eab308; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                        View Medication Schedule
                    </a>
                </div>
            </div>
            
            {_email_footer()}
        </div>
    </body>
    </html>
    """
