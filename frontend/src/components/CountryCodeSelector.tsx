import React, { useState, useRef, useEffect } from 'react';
import './CountryCodeSelector.css';

interface Country {
  code: string;
  name: string;
  flag: string;
}

interface CountryCodeSelectorProps {
  onSelect: (country: Country) => void;
  selectedCountry: Country;
  isOpen: boolean;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  onSelect,
  selectedCountry,
  isOpen
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const countries: Country[] = [
    { code: '+86', name: '中国', flag: '🇨🇳' },
    { code: '+852', name: '香港', flag: '🇭🇰' },
    { code: '+886', name: '台湾', flag: '🇹🇼' },
    { code: '+853', name: '澳门', flag: '🇲🇴' },
    { code: '+1', name: '美国', flag: '🇺🇸' },
    { code: '+81', name: '日本', flag: '🇯🇵' },
    { code: '+82', name: '韩国', flag: '🇰🇷' },
    { code: '+44', name: '英国', flag: '🇬🇧' },
    { code: '+65', name: '新加坡', flag: '🇸🇬' },
    { code: '+60', name: '马来西亚', flag: '🇲🇾' }
  ];

  // 同步外部isOpen状态
  useEffect(() => {
    setInternalIsOpen(isOpen);
  }, [isOpen]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInternalIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country: Country) => {
    onSelect(country);
    setInternalIsOpen(false);
  };

  const toggleDropdown = () => {
    setInternalIsOpen(!internalIsOpen);
  };

  return (
    <div className="country-code-selector" ref={dropdownRef} data-testid="country-code-selector">
      <button
        type="button"
        className="selector-button"
        onClick={toggleDropdown}
        data-testid="country-selector-button"
      >
        <span className="country-flag">{selectedCountry.flag}</span>
        <span className="country-code">{selectedCountry.code}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {internalIsOpen && (
        <div className="dropdown" data-testid="country-dropdown">
          <div className="dropdown-header">
            <span>选择国家/地区</span>
          </div>
          <div className="dropdown-list">
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                className={`dropdown-item ${country.code === selectedCountry.code ? 'selected' : ''}`}
                onClick={() => handleCountrySelect(country)}
                data-testid={`country-option-${country.code.replace('+', '')}`}
              >
                <span className="country-flag">{country.flag}</span>
                <span className="country-name">{country.name}</span>
                <span className="country-code">{country.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;