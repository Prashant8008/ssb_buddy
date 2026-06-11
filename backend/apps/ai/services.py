import base64
import json

from groq import Groq

VISION_MODEL = 'llama-3.2-11b-vision-preview'
TEXT_MODEL = 'llama-3.3-70b-versatile'


def _image_to_data_url(uploaded_file) -> str:
    data = uploaded_file.read()
    mime = uploaded_file.content_type or 'image/jpeg'
    b64 = base64.b64encode(data).decode('utf-8')
    return f'data:{mime};base64,{b64}'


def _parse_json_response(text: str) -> dict:
    return json.loads(text)


def run_story_evaluation(
    client: Groq,
    *,
    test_label: str,
    system_prompt: str,
    story: str = '',
    story_image=None,
    context: str = '',
) -> dict:
    """Evaluate typed story and/or handwritten story photo."""
    story = (story or '').strip()
    has_image = story_image is not None

    if not story and not has_image:
        raise ValueError('Story text or story image is required.')

    if has_image:
        data_url = _image_to_data_url(story_image)
        user_instruction = (
            f"The attached image is a candidate's handwritten {test_label} story answer.\n"
            "Step 1: Transcribe all handwritten text from the image as accurately as possible.\n"
            "Step 2: Evaluate the transcribed story using SSB psychology standards.\n"
        )
        if context:
            user_instruction += f"\nCandidate's character/action details noted earlier:\n{context}\n"
        if story:
            user_instruction += f"\nAdditional typed story text from the candidate:\n{story}\n"
        user_instruction += (
            "\nReturn strictly a JSON object with these fields:\n"
            "- 'transcribed_story': string (handwriting transcription from the image)\n"
            "- 'theme': string\n"
            "- 'characters': string\n"
            "- 'olq_scores': object with effective_intelligence, expression, social_adaptability, initiative (0-100)\n"
            "- 'feedback': string\n"
            "- 'revised_story': string"
        )

        completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {'role': 'system', 'content': system_prompt},
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': user_instruction},
                        {'type': 'image_url', 'image_url': {'url': data_url}},
                    ],
                },
            ],
            temperature=0.4,
            max_tokens=2048,
        )
        raw = completion.choices[0].message.content or ''
        # Vision models may wrap JSON in markdown fences
        raw = raw.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
            raw = raw.strip()
        return _parse_json_response(raw)

    user_content = f"Candidate's {test_label} Written Story:\n\n"
    if context:
        user_content += f"Character/details context:\n{context}\n\n"
    user_content += story

    completion = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_content},
        ],
        response_format={'type': 'json_object'},
        temperature=0.7,
    )
    return _parse_json_response(completion.choices[0].message.content)


def run_batch_evaluation(client: Groq, *, test_label: str, system_prompt: str, items: list) -> dict:
    """Evaluate a batch of WAT sentences or SRT reactions."""
    if not items:
        raise ValueError('At least one response item is required.')

    lines = []
    for i, item in enumerate(items, start=1):
        prompt_text = item.get('prompt') or item.get('word') or item.get('situation') or ''
        answer = item.get('response') or item.get('sentence') or item.get('reaction') or ''
        lines.append(f'{i}. Prompt: {prompt_text}\n   Answer: {answer}')

    user_content = f"Candidate's {test_label} responses:\n\n" + '\n\n'.join(lines)

    completion = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_content},
        ],
        response_format={'type': 'json_object'},
        temperature=0.6,
    )
    return _parse_json_response(completion.choices[0].message.content)
