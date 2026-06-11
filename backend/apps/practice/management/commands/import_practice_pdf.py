from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from apps.practice.models import PracticePrompt

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None


class Command(BaseCommand):
    help = 'Import PPDT/TAT pictures from a PDF (one image per page).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            required=True,
            choices=['PPDT', 'TAT', 'ppdt', 'tat'],
            help='Practice type: PPDT or TAT',
        )
        parser.add_argument(
            '--file',
            help='Path to PDF file. If omitted, imports all PDFs from practice_assets/pdf/<type>/',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing prompts of this type before importing',
        )

    def handle(self, *args, **options):
        if fitz is None:
            raise CommandError('PyMuPDF is required. Run: pip install pymupdf')

        prompt_type = options['type'].upper()
        if options['clear']:
            deleted, _ = PracticePrompt.objects.filter(prompt_type=prompt_type).delete()
            self.stdout.write(self.style.WARNING(f'Removed {deleted} existing {prompt_type} prompts.'))

        if options['file']:
            pdf_paths = [Path(options['file'])]
        else:
            assets_dir = Path(settings.BASE_DIR) / 'practice_assets' / 'pdf' / prompt_type.lower()
            pdf_paths = sorted(assets_dir.glob('*.pdf'))
            if not pdf_paths:
                raise CommandError(
                    f'No PDF found in {assets_dir}. Place your file there or use --file path/to/file.pdf'
                )

        total = 0
        for pdf_path in pdf_paths:
            if not pdf_path.exists():
                raise CommandError(f'File not found: {pdf_path}')
            count = self._import_pdf(pdf_path, prompt_type)
            total += count
            self.stdout.write(self.style.SUCCESS(f'Imported {count} images from {pdf_path.name}'))

        self.stdout.write(self.style.SUCCESS(f'Done — {total} {prompt_type} pictures ready for practice.'))

    def _import_pdf(self, pdf_path: Path, prompt_type: str) -> int:
        doc = fitz.open(pdf_path)
        existing = PracticePrompt.objects.filter(prompt_type=prompt_type).count()
        imported = 0

        for page_index in range(len(doc)):
            page = doc[page_index]
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            img_bytes = pix.tobytes('png')
            picture_no = existing + imported + 1

            prompt = PracticePrompt(
                prompt_type=prompt_type,
                title=f'{prompt_type} Picture {picture_no}',
                text=f'Imported from {pdf_path.name} — page {page_index + 1}',
            )
            filename = f'{prompt_type.lower()}_{picture_no:03d}.png'
            prompt.image.save(filename, ContentFile(img_bytes), save=True)
            imported += 1

        doc.close()
        return imported
