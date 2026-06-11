import React from 'react';
import TimedPromptPractice from '../../components/ssb/TimedPromptPractice';
import { AIService } from '../../services/api';

const SRTPractice = () => (
  <TimedPromptPractice
    type="SRT"
    title="SRT Practice Session"
    subtitle="Situation Reaction Test"
    secondsPerItem={30}
    itemCount={8}
    promptLabel="Situation"
    answerPlaceholder="What would you do? Write your reaction..."
    evaluateBatch={(items) => AIService.evaluateSRT(items)}
  />
);

export default SRTPractice;
