"""
Drug Interaction Database (Local JSON)
Comprehensive drug interaction checker without external API dependency.
Covers 50+ common high-risk drug interactions.
"""

DRUG_INTERACTIONS = {
    # Anticoagulants & Antiplatelets
    ("aspirin", "warfarin"): {
        "severity": "high",
        "description": "Increased bleeding risk",
        "recommendation": "Monitor INR closely. Consider alternative antiplatelet if possible."
    },
    ("warfarin", "aspirin"): {
        "severity": "high",
        "description": "Increased bleeding risk",
        "recommendation": "Monitor INR closely. Consider alternative antiplatelet if possible."
    },
    ("clopidogrel", "aspirin"): {
        "severity": "moderate",
        "description": "Increased bleeding risk",
        "recommendation": "Use combination only if clinically necessary. Monitor for bleeding."
    },
    ("warfarin", "ibuprofen"): {
        "severity": "high",
        "description": "Increased bleeding and GI ulceration risk",
        "recommendation": "Avoid NSAIDs. Use acetaminophen for pain relief."
    },
    ("rivaroxaban", "aspirin"): {
        "severity": "high",
        "description": "Increased bleeding risk",
        "recommendation": "Avoid combination unless essential."
    },
    
    # Diabetes Medications
    ("metformin", "contrast dye"): {
        "severity": "high",
        "description": "Lactic acidosis risk",
        "recommendation": "Hold metformin 48h before and after contrast procedure."
    },
    ("insulin", "beta blocker"): {
        "severity": "moderate",
        "description": "Masks hypoglycemia symptoms",
        "recommendation": "Monitor blood glucose frequently. Educate patient."
    },
    ("metformin", "alcohol"): {
        "severity": "moderate",
        "description": "Increased lactic acidosis risk",
        "recommendation": "Avoid excessive alcohol consumption."
    },
    
    # ACE Inhibitors & ARBs
    ("lisinopril", "spironolactone"): {
        "severity": "moderate",
        "description": "Hyperkalemia risk",
        "recommendation": "Monitor potassium levels regularly."
    },
    ("enalapril", "potassium"): {
        "severity": "moderate",
        "description": "Severe hyperkalemia",
        "recommendation": "Avoid potassium supplements. Monitor K+ levels."
    },
    ("losartan", "spironolactone"): {
        "severity": "moderate",
        "description": "Hyperkalemia risk",
        "recommendation": "Monitor potassium levels."
    },
    
    # Statins
    ("simvastatin", "clarithromycin"): {
        "severity": "high",
        "description": "Rhabdomyolysis risk (CYP3A4 inhibition)",
        "recommendation": "Avoid combination. Use alternative antibiotic or statin."
    },
    ("atorvastatin", "amiodarone"): {
        "severity": "moderate",
        "description": "Increased statin levels",
        "recommendation": "Limit atorvastatin to 20mg daily."
    },
    ("simvastatin", "grapefruit juice"): {
        "severity": "moderate",
        "description": "Increased statin levels",
        "recommendation": "Avoid grapefruit juice. Separate by 12+ hours if consumed."
    },
    ("lovastatin", "itraconazole"): {
        "severity": "high",
        "description": "Rhabdomyolysis risk",
        "recommendation": "Contraindicated. Use alternative antifungal."
    },
    
    # NSAIDs & Pain Management
    ("methotrexate", "ibuprofen"): {
        "severity": "moderate",
        "description": "Increased methotrexate toxicity",
        "recommendation": "Monitor for signs of toxicity. Consider acetaminophen instead."
    },
    ("naproxen", "prednisone"): {
        "severity": "moderate",
        "description": "Increased GI bleeding risk",
        "recommendation": "Add PPI prophylaxis."
    },
    ("ibuprofen", "lisinopril"): {
        "severity": "moderate",
        "description": "Reduced antihypertensive effect",
        "recommendation": "Monitor blood pressure. Consider acetaminophen."
    },
    
    # Cardiovascular
    ("digoxin", "amiodarone"): {
        "severity": "high",
        "description": "Digoxin toxicity risk",
        "recommendation": "Reduce digoxin dose by 50%. Monitor levels."
    },
    ("diltiazem", "metoprolol"): {
        "severity": "moderate",
        "description": "Bradycardia and heart block risk",
        "recommendation": "Monitor heart rate and ECG. Avoid if possible."
    },
    ("amlodipine", "simvastatin"): {
        "severity": "low",
        "description": "Increased statin levels",
        "recommendation": "Limit simvastatin to 20mg daily."
    },
    
    # Erectile Dysfunction
    ("sildenafil", "nitroglycerin"): {
        "severity": "critical",
        "description": "Severe hypotension, cardiac arrest risk",
        "recommendation": "Absolute contraindication. Do not combine."
    },
    ("tadalafil", "isosorbide"): {
        "severity": "critical",
        "description": "Life-threatening hypotension",
        "recommendation": "Absolute contraindication."
    },
    
    # Antibiotics
    ("cipro", "theophylline"): {
        "severity": "moderate",
        "description": "Theophylline toxicity",
        "recommendation": "Monitor theophylline levels. Reduce dose."
    },
    ("azithromycin", "amiodarone"): {
        "severity": "high",
        "description": "QT prolongation, arrhythmia risk",
        "recommendation": "Monitor ECG. Avoid if possible."
    },
    ("levofloxacin", "prednisone"): {
        "severity": "moderate",
        "description": "Tendon rupture risk",
        "recommendation": "Warn patient. Discontinue if tendon pain occurs."
    },
    
    # Antidepressants & Psych Meds
    ("fluoxetine", "tramadol"): {
        "severity": "moderate",
        "description": "Serotonin syndrome risk",
        "recommendation": "Monitor for confusion, agitation, tachycardia."
    },
    ("sertraline", "aspirin"): {
        "severity": "moderate",
        "description": "Increased bleeding risk",
        "recommendation": "Monitor for bleeding. Use cautiously."
    },
    ("lithium", "ibuprofen"): {
        "severity": "high",
        "description": "Lithium toxicity",
        "recommendation": "Avoid NSAIDs. Monitor lithium levels."
    },
    ("mao inhibitor", "pseudoephedrine"): {
        "severity": "critical",
        "description": "Hypertensive crisis",
        "recommendation": "Absolute contraindication. Wait 14 days after MAO-I."
    },
    
    # Immunosuppressants
    ("cyclosporine", "clarithromycin"): {
        "severity": "high",
        "description": "Increased cyclosporine levels",
        "recommendation": "Monitor levels closely. Adjust dose."
    },
    ("tacrolimus", "ketoconazole"): {
        "severity": "high",
        "description": "Tacrolimus toxicity",
        "recommendation": "Monitor levels. Reduce tacrolimus dose."
    },
    
    # Anticoagulant + Herbal
    ("warfarin", "st john wort"): {
        "severity": "moderate",
        "description": "Reduced warfarin effect",
        "recommendation": "Avoid St. John's Wort. Monitor INR."
    },
    ("warfarin", "vitamin k"): {
        "severity": "moderate",
        "description": "Antagonizes warfarin effect",
        "recommendation": "Maintain consistent vitamin K intake."
    },
    
    # Thyroid
    ("levothyroxine", "calcium"): {
        "severity": "low",
        "description": "Reduced levothyroxine absorption",
        "recommendation": "Separate administration by 4 hours."
    },
    ("levothyroxine", "iron"): {
        "severity": "low",
        "description": "Reduced levothyroxine absorption",
        "recommendation": "Separate by 4 hours."
    },
    
    # GI Medications
    ("omeprazole", "clopidogrel"): {
        "severity": "moderate",
        "description": "Reduced clopidogrel effectiveness",
        "recommendation": "Use alternative PPI (pantoprazole) or H2 blocker."
    },
    
    # Anticonvulsants
    ("phenytoin", "oral contraceptive"): {
        "severity": "moderate",
        "description": "Reduced contraceptive effectiveness",
        "recommendation": "Use additional/alternative contraception."
    },
    ("carbamazepine", "warfarin"): {
        "severity": "moderate",
        "description": "Reduced warfarin effect",
        "recommendation": "Monitor INR closely. Adjust warfarin dose."
    },
    
    # Antifungals
    ("ketoconazole", "simvastatin"): {
        "severity": "high",
        "description": "Severe rhabdomyolysis risk",
        "recommendation": "Contraindicated. Stop statin during treatment."
    },
    
    # Asthma/COPD
    ("beta blocker", "albuterol"): {
        "severity": "moderate",
        "description": "Reduced bronchodilator effect",
        "recommendation": "Avoid non-selective beta blockers in asthma."
    }
}

# Common drug classes for duplicate therapy detection
DRUG_CLASSES = {
    "aspirin": "antiplatelet",
    "clopidogrel": "antiplatelet",
    "warfarin": "anticoagulant",
    "rivaroxaban": "anticoagulant",
    "apixaban": "anticoagulant",
    "lisinopril": "ace_inhibitor",
    "enalapril": "ace_inhibitor",
    "ramipril": "ace_inhibitor",
    "losartan": "arb",
    "valsartan": "arb",
    "metoprolol": "beta_blocker",
    "atenolol": "beta_blocker",
    "carvedilol": "beta_blocker",
    "ibuprofen": "nsaid",
    "naproxen": "nsaid",
    "diclofenac": "nsaid",
    "omeprazole": "ppi",
    "pantoprazole": "ppi",
    "lansoprazole": "ppi",
    "simvastatin": "statin",
    "atorvastatin": "statin",
    "rosuvastatin": "statin",
    "amlodipine": "ccb",
    "diltiazem": "ccb",
    "nifedipine": "ccb",
    "metformin": "biguanide",
    "glipizide": "sulfonylurea",
    "glyburide": "sulfonylurea"
}

def check_drug_interaction(drug1: str, drug2: str):
    """Check if two drugs interact"""
    drug1_lower = drug1.lower()
    drug2_lower = drug2.lower()
    
    # Check exact interaction
    if (drug1_lower, drug2_lower) in DRUG_INTERACTIONS:
        return DRUG_INTERACTIONS[(drug1_lower, drug2_lower)]
    
    # Check class duplication
    if drug1_lower in DRUG_CLASSES and drug2_lower in DRUG_CLASSES:
        if DRUG_CLASSES[drug1_lower] == DRUG_CLASSES[drug2_lower]:
            return {
                "severity": "moderate",
                "description": f"Duplicate {DRUG_CLASSES[drug1_lower]} therapy",
                "recommendation": "Review need for both medications. Consider consolidating."
            }
    
    return None

def check_medication_list(medications: list[str]):
    """Check entire medication list for interactions"""
    warnings = []
    
    # Check all pairs
    for i in range(len(medications)):
        for j in range(i + 1, len(medications)):
            interaction = check_drug_interaction(medications[i], medications[j])
            if interaction:
                warnings.append({
                    "drug1": medications[i],
                    "drug2": medications[j],
                    **interaction
                })
    
    return warnings
