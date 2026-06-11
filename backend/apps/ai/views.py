import json
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from decouple import config
from groq import Groq

from .services import run_batch_evaluation, run_story_evaluation

GROQ_API_KEY = config('GROQ_API_KEY', default='')
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f'Failed to initialize Groq client: {e}')

PPDT_SYSTEM_PROMPT = (
    'You are an expert Services Selection Board (SSB) psychologist selector. '
    'Your task is to evaluate a candidate\'s written story for the Picture Perception and Description Test (PPDT). '
    'Assess the story based on standard Officer Like Qualities (OLQs), structured narrative development, and character descriptions. '
    'Provide constructive, exam-focused feedback.'
)

TAT_SYSTEM_PROMPT = (
    'You are an expert SSB psychologist evaluating a Thematic Apperception Test (TAT) story. '
    'Assess the hero\'s constructive action, positive theme, self-reliance, and OLQs. '
    'Provide constructive psychology feedback.'
)

TEXT_JSON_FIELDS = (
    'Provide the output strictly as a JSON object with the following fields:\n'
    "- 'theme': Summary of the story's main theme.\n"
    "- 'characters': Assessment of how characters were perceived (mood, age, gender, action).\n"
    "- 'olq_scores': An object scoring the following out of 100:\n"
    "  * 'effective_intelligence': integer\n"
    "  * 'expression': integer\n"
    "  * 'social_adaptability': integer\n"
    "  * 'initiative': integer\n"
    "- 'feedback': Constructive feedback detailing strengths and areas of improvements.\n"
    "- 'revised_story': A professionally polished version of the story showing active leadership, resourcefulness, "
    'and resolution without feeling unrealistic.'
)


class PPDTEvaluatorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI evaluation service is currently unavailable. Groq API Key is not set.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        story = request.data.get('story', '')
        context = request.data.get('context', '')
        story_image = request.FILES.get('story_image')

        if not story and not story_image:
            return Response(
                {'detail': 'Type your story or upload a photo of your handwritten story.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = run_story_evaluation(
                client,
                test_label='PPDT',
                system_prompt=PPDT_SYSTEM_PROMPT + '\n' + TEXT_JSON_FIELDS,
                story=story,
                story_image=story_image,
                context=context,
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except json.JSONDecodeError:
            return Response(
                {'detail': 'AI returned an invalid response. Please try a clearer photo or typed story.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TATEvaluatorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI evaluation service is currently unavailable. Groq API Key is not set.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        story = request.data.get('story', '')
        context = request.data.get('context', '')
        story_image = request.FILES.get('story_image')

        if not story and not story_image:
            return Response(
                {'detail': 'Type your story or upload a photo of your handwritten story.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = run_story_evaluation(
                client,
                test_label='TAT',
                system_prompt=TAT_SYSTEM_PROMPT + '\n' + TEXT_JSON_FIELDS,
                story=story,
                story_image=story_image,
                context=context,
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except json.JSONDecodeError:
            return Response(
                {'detail': 'AI returned an invalid response. Please try a clearer photo or typed story.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


WAT_JSON_FIELDS = (
    'Return strictly a JSON object with:\n'
    "- 'overall_score': integer 0-100\n"
    "- 'positive_count': integer — how many sentences are positive/active\n"
    "- 'item_feedback': array of {prompt, response, rating, comment} for each word\n"
    "- 'feedback': overall constructive feedback\n"
    "- 'tips': array of 3 short improvement tips"
)

SRT_JSON_FIELDS = (
    'Return strictly a JSON object with:\n'
    "- 'overall_score': integer 0-100\n"
    "- 'olq_highlights': object with leadership, responsibility, social_adjustment (0-100 each)\n"
    "- 'item_feedback': array of {prompt, response, rating, comment} for each situation\n"
    "- 'feedback': overall psychology feedback\n"
    "- 'sample_improvements': array of 2 improved sample reactions"
)


class WATEvaluatorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI evaluation service is currently unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        items = request.data.get('items', [])
        if not items:
            return Response({'detail': 'items array is required.'}, status=status.HTTP_400_BAD_REQUEST)
        system = (
            'You are an SSB psychology expert evaluating Word Association Test (WAT) sentences. '
            'Sentences should be positive, observational, first-person, natural (not mugged-up), and show OLQs. '
        ) + WAT_JSON_FIELDS
        try:
            result = run_batch_evaluation(client, test_label='WAT', system_prompt=system, items=items)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SRTEvaluatorView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI evaluation service is currently unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        items = request.data.get('items', [])
        if not items:
            return Response({'detail': 'items array is required.'}, status=status.HTTP_400_BAD_REQUEST)
        system = (
            'You are an SSB psychologist evaluating Situation Reaction Test (SRT) answers. '
            'Look for practical action, responsibility, leadership, and socially adaptable responses. '
        ) + SRT_JSON_FIELDS
        try:
            result = run_batch_evaluation(client, test_label='SRT', system_prompt=system, items=items)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InterviewCoachView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI interview coach is currently unavailable. Groq API Key is not set.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        transcript = request.data.get('transcript', '')
        if not transcript:
            return Response({'detail': 'Transcript or answer text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        system_prompt = (
            'You are an expert SSB Interviewing Officer (IO). '
            "Analyze the candidate's response in the provided transcript for Officer Like Qualities (OLQs), confidence, logical reasoning, and maturity. "
            'Provide the response strictly as a JSON object with the following fields:\n'
            "- 'olq_analysis': An object containing evaluation descriptions for key traits like leadership, cooperation, and decision_making.\n"
            "- 'strengths': A list of strings listing candidate's positive points.\n"
            "- 'weaknesses': A list of strings listing fields that need correction or sound defensive.\n"
            "- 'improved_response': A draft showing how the candidate should have answered this question to exhibit strong OLQs naturally.\n"
            "- 'overall_rating': An integer from 1 to 5 scoring the performance."
        )

        try:
            completion = client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': transcript},
                ],
                response_format={'type': 'json_object'},
                temperature=0.7,
            )
            result_text = completion.choices[0].message.content
            result_json = json.loads(result_text)
            return Response(result_json, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MentorChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not client:
            return Response(
                {'detail': 'AI Mentor is currently offline. Groq API Key is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        module = request.data.get('module', 'general')
        message = request.data.get('message', '')
        history = request.data.get('history', [])

        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        prompts = {
            'interview': (
                'You are an experienced SSB Interviewing Officer. Speak in character. '
                "Assess the candidate's answers to typical mock questions. Ask follow-up questions about "
                'their background, interests, and OLQs. Give direct, constructive, and firm guidance.'
            ),
            'ppdt': (
                'You are an SSB Psychologist. You guide aspirants on how to write impact-driven, '
                'cohesive stories for Picture Perception and Description Tests. Analyze story drafts, '
                'point out character description errors (mood/action inconsistencies), and help them think logically.'
            ),
            'tat': (
                'You are an SSB Psychologist Coach specializing in Thematic Apperception Test (TAT). '
                'Help candidates structure their responses, focus on a positive hero doing constructive tasks, '
                'avoid negative/melodramatic themes, and demonstrate self-reliance.'
            ),
            'wat': (
                'You are an SSB Coach for the Word Association Test (WAT). Give prompt words to the aspirant, '
                'evaluate their sentences, highlight if they sound mugged-up, pre-prepared, or negative, '
                'and teach them how to write active, observation-based, positive sentences.'
            ),
            'general': (
                'You are a friendly, encouraging, yet disciplined SSB AI Mentor. You help aspirants with general doubts '
                'about GTO, Psychology tests, interview rounds, and fitness tests. Address them respectfully as \'Aspirant\' '
                'and give motivating advice.'
            ),
        }

        system_prompt = prompts.get(module, prompts['general'])
        system_prompt += ' Keep your responses concise, focused, professional, and military-like. Address the aspirant directly.'

        messages = [{'role': 'system', 'content': system_prompt}]
        for item in history:
            role = 'user' if item.get('own') or item.get('sender') == 'Me' else 'assistant'
            content = item.get('text') or item.get('content') or ''
            if content:
                messages.append({'role': role, 'content': content})

        messages.append({'role': 'user', 'content': message})

        try:
            completion = client.chat.completions.create(
                model='llama-3.3-70b-versatile',
                messages=messages,
                temperature=0.7,
                max_tokens=800,
            )
            reply = completion.choices[0].message.content
            return Response({'reply': reply}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Groq API Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
