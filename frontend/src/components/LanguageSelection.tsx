import React, { useState } from 'react';
import type { Language } from '../types/config';
import { LANGUAGE_OPTIONS } from '../constants/options';

interface LanguageSelectionProps {
  selectedLanguages: Language[];
  onLanguagesChange: (languages: Language[]) => void;
}

export const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  selectedLanguages,
  onLanguagesChange
}) => {
  const [languageVersions, setLanguageVersions] = useState<Record<string, string>>({});

  const isLanguageSelected = (languageName: string) => {
    return selectedLanguages.some(lang => lang.name === languageName);
  };

  const handleLanguageToggle = (languageName: string) => {
    const isSelected = isLanguageSelected(languageName);

    if (isSelected) {
      // Remove language
      const newLanguages = selectedLanguages.filter(lang => lang.name !== languageName);
      onLanguagesChange(newLanguages);

      // Remove version tracking
      const newVersions = { ...languageVersions };
      delete newVersions[languageName];
      setLanguageVersions(newVersions);
    } else {
      // Add language with default version
      const languageOption = LANGUAGE_OPTIONS.find(opt => opt.name === languageName);
      if (languageOption) {
        const defaultVersion = languageOption.versions[0];
        const newLanguage: Language = {
          name: languageName,
          version: defaultVersion
        };

        onLanguagesChange([...selectedLanguages, newLanguage]);
        setLanguageVersions({
          ...languageVersions,
          [languageName]: defaultVersion
        });
      }
    }
  };

  const handleVersionChange = (languageName: string, version: string) => {
    setLanguageVersions({
      ...languageVersions,
      [languageName]: version
    });

    const newLanguages = selectedLanguages.map(lang =>
      lang.name === languageName
        ? { ...lang, version }
        : lang
    );
    onLanguagesChange(newLanguages);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Select Languages</h2>
      <p className="text-gray-600 mb-6">Choose the programming languages and runtimes you need.</p>

      <div className="space-y-6">
        {LANGUAGE_OPTIONS.map((langOption) => {
          const isSelected = isLanguageSelected(langOption.name);
          const currentVersion = languageVersions[langOption.name] || langOption.versions[0];

          return (
            <div key={langOption.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="checkbox"
                  id={langOption.name}
                  checked={isSelected}
                  onChange={() => handleLanguageToggle(langOption.name)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={langOption.name} className="text-sm font-medium">
                  {langOption.displayName}
                </label>
              </div>

              {isSelected && (
                <div className="ml-7">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {langOption.versions.map((version) => (
                      <button
                        key={version}
                        onClick={() => handleVersionChange(langOption.name, version)}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                          currentVersion === version
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300 hover:border-blue-500'
                        }`}
                      >
                        {version}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};