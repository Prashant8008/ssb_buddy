import React from 'react';
import TimedPromptPractice from '../../components/ssb/TimedPromptPractice';
import { AIService } from '../../services/api';

const WATPractice = () => (
  <TimedPromptPractice
    type="WAT"
    title="WAT Practice Session"
    subtitle="Word Association Test"
    secondsPerItem={15}
    itemCount={10}
    promptLabel="Word"
    answerPlaceholder="Write your first spontaneous sentence..."
    evaluateBatch={(items) => AIService.evaluateWAT(items)}
  />
);

export default WATPractice;
