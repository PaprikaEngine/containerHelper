import { useState } from 'react';
import { StepLayout } from './components/StepLayout';
import { OSSelection } from './components/OSSelection';
import { LanguageSelection } from './components/LanguageSelection';
import { DockerfilePreview } from './components/DockerfilePreview';
import type { EnvironmentConfig, OsConfig, Language } from './types/config';
import { TOTAL_STEPS } from './constants/options';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<EnvironmentConfig>({
    os: { type: '', version: '' },
    languages: [],
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOSSelect = (os: OsConfig) => {
    setConfig(prev => ({ ...prev, os }));
  };

  const handleLanguagesChange = (languages: Language[]) => {
    setConfig(prev => ({ ...prev, languages }));
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !config.os.type || !config.os.version;
      case 2:
        return config.languages.length === 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OSSelection
            selectedOS={config.os}
            onOSSelect={handleOSSelect}
          />
        );
      case 2:
        return (
          <LanguageSelection
            selectedLanguages={config.languages}
            onLanguagesChange={handleLanguagesChange}
          />
        );
      case 3:
        return (
          <DockerfilePreview
            config={config}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <StepLayout
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        title="Container Helper - Development Environment Setup"
        onNext={handleNext}
        onPrev={handlePrev}
        nextDisabled={isNextDisabled()}
      >
        {renderStepContent()}
      </StepLayout>
    </div>
  );
}

export default App;
