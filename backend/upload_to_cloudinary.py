import os
import json
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

import cloudinary
import cloudinary.uploader
from decouple import config

# Configure Cloudinary
cloudinary.config(
    cloud_name = config('CLOUDINARY_CLOUD_NAME'),
    api_key    = config('CLOUDINARY_API_KEY'),
    api_secret = config('CLOUDINARY_API_SECRET'),
    secure     = True
)

IMAGES_DIR = os.path.join(os.path.dirname(__file__), 'media', 'practice', 'prompts')

results = []
failed  = []

if not os.path.exists(IMAGES_DIR):
    print(f"Error: {IMAGES_DIR} directory does not exist.")
    sys.exit(1)

image_files = sorted([
    f for f in os.listdir(IMAGES_DIR)
    if f.lower().endswith('.png') or f.lower().endswith('.jpg') or f.lower().endswith('.jpeg')
])

total = len(image_files)
print(f"Found {total} images. Starting upload...\n")

import requests
import time

CLOUD_NAME = config('CLOUDINARY_CLOUD_NAME')

for i, filename in enumerate(image_files, 1):
    filepath = os.path.join(IMAGES_DIR, filename)
    base_name = os.path.splitext(filename)[0]
    ext = os.path.splitext(filename)[1].lower().replace('.', '')
    public_id = f"practice/prompts/{base_name}"  # e.g. practice/prompts/ppdt_001
    
    # Correct format extension mapped by Cloudinary (jpeg resolves to jpg)
    cloudinary_ext = 'jpg' if ext == 'jpeg' else ext
    check_url = f"https://res.cloudinary.com/{CLOUD_NAME}/image/upload/v1/practice/prompts/{base_name}.{cloudinary_ext}"

    try:
        # Check if already uploaded
        r = requests.head(check_url, timeout=5)
        if r.status_code == 200:
            print(f"[{i}/{total}] SKIPPED (already uploaded): {filename}")
            results.append({
                "name"      : filename,
                "public_id" : public_id,
                "url"       : check_url,
            })
            continue
    except Exception:
        pass

    try:
        response = cloudinary.uploader.upload(
            filepath,
            public_id   = public_id,
            overwrite   = True,
            resource_type = "image"
        )

        url = response.get('secure_url')
        results.append({
            "name"      : filename,
            "public_id" : response.get('public_id'),
            "url"       : url,
            "width"     : response.get('width'),
            "height"    : response.get('height'),
            "format"    : response.get('format'),
            "bytes"     : response.get('bytes'),
        })

        print(f"[{i}/{total}] SUCCESS: {filename} -> {url}")
        
        # Sleep to prevent Windows socket exhaustion / rate limiting
        time.sleep(0.5)

    except Exception as e:
        print(f"[{i}/{total}] FAILED: {filename} -> {e}")
        failed.append({"name": filename, "error": str(e)})

# Save results
output_path = os.path.join(os.path.dirname(__file__), 'cloudinary_image_links.json')
with open(output_path, 'w') as f:
    json.dump(results, f, indent=2)

print(f"\nDone! {len(results)}/{total} uploaded successfully.")
print(f"URLs saved to: {output_path}")

if failed:
    print(f"\n{len(failed)} failed:")
    for f in failed:
        print(f"   - {f['name']}: {f['error']}")
