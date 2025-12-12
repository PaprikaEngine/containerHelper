import React, { useState } from 'react';
import type { OsConfig } from '../types/config';
import { OS_OPTIONS } from '../constants/options';

interface OSSelectionProps {
  selectedOS: OsConfig;
  onOSSelect: (os: OsConfig) => void;
}

export const OSSelection: React.FC<OSSelectionProps> = ({ selectedOS, onOSSelect }) => {
  const [selectedType, setSelectedType] = useState(selectedOS.type);
  const [selectedVersion, setSelectedVersion] = useState(selectedOS.version);

  const handleOSClick = (osType: string) => {
    setSelectedType(osType);
    const osOption = OS_OPTIONS.find(os => os.type === osType);
    if (osOption && osOption.versions.length > 0) {
      const defaultVersion = osOption.versions[0];
      setSelectedVersion(defaultVersion);
      onOSSelect({ type: osType, version: defaultVersion });
    }
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    onOSSelect({ type: selectedType, version });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Choose Base OS</h2>
      <p className="text-gray-600 mb-6">Select the operating system for your development environment.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {OS_OPTIONS.map((os) => (
          <div
            key={os.type}
            onClick={() => handleOSClick(os.type)}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedType === os.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500'
            }`}
          >
            <h3 className="font-medium">{os.name}</h3>
            <p className="text-sm text-gray-500">{os.versions.join(', ')}</p>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Select Version</h3>
          <div className="flex flex-wrap gap-2">
            {OS_OPTIONS.find(os => os.type === selectedType)?.versions.map((version) => (
              <button
                key={version}
                onClick={() => handleVersionSelect(version)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  selectedVersion === version
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
};