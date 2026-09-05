type StoryChapter = {
  key: string;
  body: string;
};

type StoryQuestion = {
  code: string;
  label: string;
};

export type LabeledChapter = {
  key: string;
  label: string;
  body: string;
};

export const resolveStoryQuestionLabels = (
  chapters: StoryChapter[],
  storyQuestions: StoryQuestion[],
): LabeledChapter[] => {
  const labelByCode = new Map(
    storyQuestions.map((question) => [question.code, question.label]),
  );

  return chapters.map((chapter) => {
    const label = labelByCode.get(chapter.key);

    if (label === undefined) {
      throw new Error(`Unknown story question: ${chapter.key}`);
    }

    return { key: chapter.key, label, body: chapter.body };
  });
};
