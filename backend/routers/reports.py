from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from database.database import mongo_db
from database.models_sql import User
from auth.auth import get_current_user
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import io

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.post("/generate")
async def generate_report(current_user: User = Depends(get_current_user)):
    """
    Generates a comprehensive PDF medical report with full profile and risk predictions.
    """
    try:
        # --- Fetch Data ---
        patient_id = current_user.username
        
        # 1. Full Patient Profile (Correct Collection)
        profile = await mongo_db.patient_profiles.find_one({"patient_id": patient_id}) or {}
        
        # 2. Medical History & Prescriptions
        prescriptions = await mongo_db.prescriptions.find({"patient_id": patient_id}).sort("created_at", -1).to_list(10)
        history = await mongo_db.medical_history.find({"patient_id": patient_id}).sort("date_diagnosed", -1).to_list(10)
        
        # 3. Risk Predictions (Latest)
        heart_pred = await mongo_db.heart_predictions.find_one({"patient_id": patient_id}, sort=[("created_at", -1)])
        diabetes_pred = await mongo_db.diabetes_predictions.find_one({"patient_id": patient_id}, sort=[("created_at", -1)])
        
        # --- PDF Generation ---
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=40, leftMargin=40, 
            topMargin=40, bottomMargin=40
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Colors & Styles
        PRIMARY_COLOR = colors.HexColor("#2563EB")
        SECONDARY_COLOR = colors.HexColor("#F3F4F6")
        TEXT_COLOR = colors.HexColor("#1F2937")
        RISK_HIGH = colors.HexColor("#DC2626")
        RISK_LOW = colors.HexColor("#059669")
        
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=26, textColor=PRIMARY_COLOR, spaceAfter=10, alignment=1)
        subtitle_style = ParagraphStyle('CustomSubtitle', parent=styles['Normal'], fontSize=12, textColor=colors.gray, spaceAfter=30, alignment=1)
        section_header = ParagraphStyle('SectionHeader', parent=styles['Heading2'], fontSize=16, textColor=PRIMARY_COLOR, spaceAfter=15, spaceBefore=20)
        normal_text = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=10, textColor=TEXT_COLOR, leading=14)
        bold_text = ParagraphStyle('BoldText', parent=normal_text, fontName='Helvetica-Bold')

        # Header/Footer
        def header_footer(canvas, doc):
            canvas.saveState()
            canvas.setFillColor(SECONDARY_COLOR)
            canvas.rect(0, letter[1]-100, letter[0], 100, fill=1, stroke=0)
            canvas.setStrokeColor(PRIMARY_COLOR)
            canvas.setLineWidth(1)
            canvas.line(40, 50, letter[0]-40, 50)
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.gray)
            canvas.drawString(40, 35, f"Confidential Medical Record - {datetime.now().strftime('%Y-%m-%d')}")
            canvas.drawRightString(letter[0]-40, 35, f"Page {doc.page}")
            canvas.restoreState()

        # Styles Helpers
        def create_styled_table(data, col_widths):
            t = Table(data, colWidths=col_widths)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_COLOR),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SECONDARY_COLOR]),
                ('TEXTCOLOR', (0, 1), (-1, -1), TEXT_COLOR),
                ('TPADDING', (0, 0), (-1, -1), 8),
            ]))
            return t
        
        # --- Helper: Safe Text ---
        def safe_text(val, default="N/A"):
            if val is None:
                return default
            return str(val)

        # --- Document Content ---
        
        elements.append(Paragraph("HealthForesight", title_style))
        elements.append(Paragraph("Comprehensive Medical Assessment", subtitle_style))
        elements.append(Spacer(1, 10))

        # 1. Patient Profile
        elements.append(Paragraph("Patient Profile", section_header))
        
        p_data = [
            [Paragraph("<b>Full Name:</b>", normal_text), Paragraph(safe_text(current_user.username), normal_text),
             Paragraph("<b>Report Date:</b>", normal_text), Paragraph(datetime.now().strftime('%b %d, %Y'), normal_text)],
            
            [Paragraph("<b>Age / Gender:</b>", normal_text), Paragraph(f"{safe_text(profile.get('age'))} / {safe_text(profile.get('gender'))}", normal_text),
             Paragraph("<b>Blood Type:</b>", normal_text), Paragraph(safe_text(profile.get('blood_type')), normal_text)],
             
            [Paragraph("<b>Height / Weight:</b>", normal_text), Paragraph(f"{safe_text(profile.get('height'))} cm / {safe_text(profile.get('weight'))} kg", normal_text),
             Paragraph("<b>BMI:</b>", normal_text), Paragraph(safe_text(profile.get('bmi')), normal_text)],
        ]
        
        t_profile = Table(p_data, colWidths=[100, 140, 100, 140])
        t_profile.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 0), (-1, -1), TEXT_COLOR),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t_profile)
        elements.append(Spacer(1, 15))
        
        # 2. Risk Analysis (New Section)
        elements.append(Paragraph("AI Risk Analysis", section_header))
        
        risk_data = [["Analysis Type", "Prediction", "Probability", "Status"]]
        
        # Heart
        if heart_pred:
            h_prob = heart_pred.get("probability", 0)
            h_lbl = "High Risk" if heart_pred.get("prediction") == 1 else "Low Risk"
            h_color = RISK_HIGH if heart_pred.get("prediction") == 1 else RISK_LOW
            risk_data.append([
                "Heart Disease",
                h_lbl,
                f"{h_prob:.1%}",
                Paragraph(f"<font color='{h_color.hexval()}'><b>{h_lbl.upper()}</b></font>", normal_text)
            ])
        else:
            risk_data.append(["Heart Disease", "N/A", "N/A", "No Data"])
            
        # Diabetes
        if diabetes_pred:
            d_prob = diabetes_pred.get("probability", 0)
            d_lbl = "Positive" if diabetes_pred.get("prediction") == 1 else "Negative"
            d_color = RISK_HIGH if diabetes_pred.get("prediction") == 1 else RISK_LOW
            risk_data.append([
                "Diabetes Assessment",
                d_lbl,
                f"{d_prob:.1%}",
                Paragraph(f"<font color='{d_color.hexval()}'><b>{d_lbl.upper()}</b></font>", normal_text)
            ])
        else:
            risk_data.append(["Diabetes", "N/A", "N/A", "No Data"])

        t_risk = create_styled_table(risk_data, [150, 120, 100, 120])
        elements.append(t_risk)
        elements.append(Spacer(1, 15))

        # 3. Clinical Vitals
        elements.append(Paragraph("Clinical Vitals & Labs", section_header))
        vitals_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Blood Pressure", f"{safe_text(profile.get('systolic_bp'))}/{safe_text(profile.get('diastolic_bp'))}", "Heart Rate", f"{safe_text(profile.get('heart_rate'))} bpm"],
            ["Glucose", f"{safe_text(profile.get('glucose'))} mg/dL", "Cholesterol", f"{safe_text(profile.get('cholesterol'))} mg/dL"],
            ["Temperature", f"{safe_text(profile.get('temperature'))} °C", "O2 Saturation", f"{safe_text(profile.get('oxygen_level'))} %"]
        ]
        t_vitals = Table(vitals_data, colWidths=[120, 120, 120, 120])
        t_vitals.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), SECONDARY_COLOR),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t_vitals)

        # 4. Medical History
        elements.append(Paragraph("Medical History", section_header))
        if history:
            h_data = [["Condition", "Diagnosed Date", "Status"]]
            for h in history:
                h_data.append([
                    Paragraph(safe_text(h.get("condition"), ""), normal_text),
                    safe_text(h.get("date_diagnosed")),
                    safe_text(h.get("status"))
                ])
            elements.append(create_styled_table(h_data, [200, 140, 140]))
        else:
            elements.append(Paragraph("No medical history recorded.", normal_text))

        # 5. Prescriptions
        elements.append(Paragraph("Active Prescriptions", section_header))
        if prescriptions:
            p_data = [["Medication", "Dosage", "Prescribed By"]]
            for p in prescriptions:
                p_data.append([
                    Paragraph(f"<b>{safe_text(p.get('medication'))}</b>", normal_text),
                    Paragraph(safe_text(p.get("dosage"), ""), normal_text),
                    safe_text(p.get("prescribed_by"))
                ])
            elements.append(create_styled_table(p_data, [180, 150, 150]))
        else:
            elements.append(Paragraph("No active prescriptions.", normal_text))

        # Disclaimer
        elements.append(Spacer(1, 40))
        elements.append(Paragraph(
            "Disclaimer: This report is generated by AI Health Platform for informational purposes only. "
            "Please consult your doctor for official medical advice.",
            ParagraphStyle('Disclaimer', parent=styles['Normal'], fontSize=8, textColor=colors.gray, alignment=1)
        ))

        doc.build(elements, onFirstPage=header_footer, onLaterPages=header_footer)
        buffer.seek(0)
        
        return Response(
            content=buffer.getvalue(), 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename=HealthForesight_Report_{patient_id}.pdf"}
        )

    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
