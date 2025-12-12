import { useState } from 'react';
import { StepLayout } from './components/StepLayout';
import { EnvironmentConfig } from './types/config';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<EnvironmentConfig>({
    os: { type: '', version: '' },
    languages: [],
  });

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Choose Base OS</h2>
            <p className="text-gray-600 mb-6">Select the operating system for your development environment.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="font-medium">Ubuntu</h3>
                <p className="text-sm text-gray-500">20.04, 22.04, 24.04</p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="font-medium">Debian</h3>
                <p className="text-sm text-gray-500">bullseye, bookworm</p>
              </div>
              <div className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer">
                <h3 className="font-medium">Alpine</h3>
                <p className="text-sm text-gray-500">Lightweight</p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Languages</h2>
            <p className="text-gray-600 mb-6">Choose the programming languages and runtimes you need.</p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="python" className="w-4 h-4 text-blue-600" />
                <label htmlFor="python" className="text-sm font-medium">Python (3.9, 3.10, 3.11, 3.12)</label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="nodejs" className="w-4 h-4 text-blue-600" />
                <label htmlFor="nodejs" className="text-sm font-medium">Node.js (18 LTS, 20 LTS, 22 LTS)</label>
              </div>
              <div className="flex items-center space-x-3">
                <input type="checkbox" id="rust" className="w-4 h-4 text-blue-600" />
                <label htmlFor="rust" className="text-sm font-medium">Rust (stable, nightly)</label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <StepLayout
        currentStep={currentStep}
        totalSteps={2}
        title="Container Helper - Development Environment Setup"
        onNext={handleNext}
        onPrev={handlePrev}
        nextDisabled={false}
      >
        {renderStepContent()}
      </StepLayout>
    </div>
  );
}

export default App;
