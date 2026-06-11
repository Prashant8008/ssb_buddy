from django import forms

POST_TYPE_CHOICES = [
    ('TEXT', 'Text'),
    ('NOTE', 'Note'),
    ('EXPERIENCE', 'Experience'),
    ('CURRENT_AFFAIRS', 'Current Affairs'),
]


class PostForm(forms.Form):
    """Plain form — Post data is stored in MongoDB, not PostgreSQL."""
    title = forms.CharField(max_length=180, required=False)
    body = forms.CharField(widget=forms.Textarea)
    post_type = forms.ChoiceField(choices=POST_TYPE_CHOICES, initial='TEXT')
    image_url = forms.URLField(required=False)


class CommentForm(forms.Form):
    """Plain form — Comment data is stored in MongoDB, not PostgreSQL."""
    body = forms.CharField(widget=forms.Textarea)
