import React from 'react';

interface StepLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  nextDisabled?: boolean;
}

export const StepLayout: React.FC<StepLayoutProps> = ({
  currentStep,
  totalSteps,
  title,
  children,
  onNext,
  onPrev,
  nextDisabled = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-sm text-gray-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>

          <div className="mb-8">
            {children}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <button
              onClick={onPrev}
              disabled={currentStep === 1}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={onNext}
              disabled={nextDisabled || currentStep === totalSteps}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === totalSteps ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};