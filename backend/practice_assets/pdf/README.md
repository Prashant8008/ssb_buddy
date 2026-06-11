# SSB Practice Image PDFs

Place your picture banks here, then import them into the app.

## Folder layout

```
practice_assets/pdf/
  ppdt/
    your-ppdt-images.pdf
  tat/
    your-tat-images.pdf
```

Each **page** in the PDF becomes one practice picture.

## Import commands

From the `backend/` folder:

```bash
# Import all PDFs in the ppdt folder
python manage.py import_practice_pdf --type PPDT

# Import all PDFs in the tat folder
python manage.py import_practice_pdf --type TAT

# Import a specific file
python manage.py import_practice_pdf --type PPDT --file "D:\path\to\ppdt.pdf"

# Replace existing pictures of that type
python manage.py import_practice_pdf --type TAT --clear
```

After import, open **SSB Practice → PPDT** or **TAT** in the app — a random picture from your PDF will be shown each session.
