// Type definitions for i18n resources
export interface TranslationResources {
  about: {
    title: string;
    subtitle: string;
    createGroupButton: string;
    motivationTitle: string;
    motivationText: string;
    featuresTitle: string;
    atGlanceTitle: string;
    altText: string;
    features: {
      getStarted: GetStartedFeature;
      noAds: FeatureTranslation;
      visualBalances: FeatureTranslation;
      iosApp: FeatureTranslation & { downloadLink: string };
      easySharing: FeatureTranslation;
      powerWebApp: FeatureTranslation & {
        instructions: {
          step1: string;
          step2: string;
          step3: string;
        };
      };
    };
  };
  balance: {
    allSettled: {
      title: string;
      description: string;
      addLink: string;
      expensesHere: string;
    };
    reimbursements: {
      title: string;
      subtitle: string;
      owes: string;
      addReimbursement: string;
    };
  };
}

interface FeatureTranslation {
  title: string;
  short: string;
  description: string;
}

interface GetStartedFeature extends FeatureTranslation {
  stepsTitle: string;
  step1: string;
  step2: string;
  step3: string;
}