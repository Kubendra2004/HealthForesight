import kagglehub
import os
import shutil

# Download latest version
path = kagglehub.dataset_download("arjunnsharma/patient-dataset-for-clustering-raw-data")

print("Path to dataset files:", path)

# --- Code to find and copy the CSV file ---

# Look inside the downloaded directory for the CSV file
for filename in os.listdir(path):
    if filename.endswith(".csv"):
        # Construct the full path to the source file
        source_path = os.path.join(path, filename)
        
        # The destination is just the filename, which places it in the current directory
        destination_path = filename 
        
        # Copy the file from the source to the destination
        shutil.copy(source_path, destination_path)
        
        print(f"✅ Success! Copied '{filename}' to your current directory.")
        break # Exit the loop after finding and copying the first CSV