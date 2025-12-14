import { useState, useEffect } from 'react';
import { StepLayout } from '../components/StepLayout';
import { OSSelection } from '../components/OSSelection';
import { LanguageSelection } from '../components/LanguageSelection';
import { DockerfilePreview } from '../components/DockerfilePreview';
import type { EnvironmentConfig, OsConfig, Language } from '../types/config';
import { TOTAL_STEPS } from '../constants/options';

const STORAGE_KEY = 'containerHelper.generatorState';

interface GeneratorState {
  currentStep: number;
  config: EnvironmentConfig;
}

// LocalStorageから状態を読み込む関数
const loadStateFromStorage = (): GeneratorState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};

// LocalStorageに状態を保存する関数
const saveStateToStorage = (state: GeneratorState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

export function Generator() {
  // LocalStorageから初期状態を読み込む
  const initialState = loadStateFromStorage();

  const [currentStep, setCurrentStep] = useState(initialState?.currentStep ?? 1);
  const [config, setConfig] = useState<EnvironmentConfig>(
    initialState?.config ?? {
      os: { type: '', version: '' },
      languages: [],
    }
  );

  // 状態が変更されたらLocalStorageに保存
  useEffect(() => {
    const state: GeneratorState = {
      currentStep,
      config,
    };
    saveStateToStorage(state);
  }, [currentStep, config]);

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
  );
}
