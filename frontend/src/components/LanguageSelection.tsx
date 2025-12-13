import React, { useState } from 'react';
import { Title, Text, Paper, Stack, Checkbox, Group, Button } from '@mantine/core';
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
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={2}>Select Languages</Title>
        <Text c="dimmed">Choose the programming languages and runtimes you need.</Text>
      </Stack>

      <Stack gap="md">
        {LANGUAGE_OPTIONS.map((langOption) => {
          const isSelected = isLanguageSelected(langOption.name);
          const currentVersion = languageVersions[langOption.name] || langOption.versions[0];

          return (
            <Paper key={langOption.name} withBorder p="md">
              <Stack gap="md">
                <Checkbox
                  label={langOption.displayName}
                  checked={isSelected}
                  onChange={() => handleLanguageToggle(langOption.name)}
                  size="md"
                />

                {isSelected && (
                  <Stack gap="xs" ml="xl">
                    <Text size="sm" fw={500}>Version:</Text>
                    <Group gap="xs">
                      {langOption.versions.map((version) => (
                        <Button
                          key={version}
                          variant={currentVersion === version ? 'filled' : 'outline'}
                          onClick={() => handleVersionChange(langOption.name, version)}
                          size="xs"
                        >
                          {version}
                        </Button>
                      ))}
                    </Group>
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
};