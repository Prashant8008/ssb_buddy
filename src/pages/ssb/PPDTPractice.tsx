import React from 'react';
import PictureStoryPractice from '../../components/ssb/PictureStoryPractice';
import { AIService } from '../../services/api';

const PPDTPractice = () => (
  <PictureStoryPractice
    type="PPDT"
    title="PPDT Practice Session"
    subtitle="Picture Perception & Description Test"
    showCharacterFields
    evaluateStory={({ story, context, storyImage }) =>
      AIService.evaluatePPDT({ story, context, storyImage })
    }
  />
);

export default PPDTPractice;
