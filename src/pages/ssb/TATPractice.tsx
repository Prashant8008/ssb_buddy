import React from 'react';
import PictureStoryPractice from '../../components/ssb/PictureStoryPractice';
import { AIService } from '../../services/api';

const TATPractice = () => (
  <PictureStoryPractice
    type="TAT"
    title="TAT Practice Session"
    subtitle="Thematic Apperception Test"
    evaluateStory={({ story, context, storyImage }) =>
      AIService.evaluateTAT({ story, context, storyImage })
    }
  />
);

export default TATPractice;
