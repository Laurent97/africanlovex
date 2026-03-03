// Phone number utilities for East African countries

// Phone number formats for East African countries
const PHONE_FORMATS = {
  RW: { // Rwanda
    pattern: /^\+250\s?7\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+250 788 123 456',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('250') && cleaned.length === 12) {
        return `+250 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  },
  KE: { // Kenya
    pattern: /^\+254\s?7\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+254 712 345 678',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('254') && cleaned.length === 12) {
        return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  },
  UG: { // Uganda
    pattern: /^\+256\s?7\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+256 712 345 678',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('256') && cleaned.length === 12) {
        return `+256 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  },
  TZ: { // Tanzania
    pattern: /^\+255\s?7\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+255 712 345 678',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('255') && cleaned.length === 12) {
        return `+255 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  },
  BI: { // Burundi
    pattern: /^\+257\s?7\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+257 712 345 678',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('257') && cleaned.length === 12) {
        return `+257 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  },
  CD: { // Congo (DRC)
    pattern: /^\+243\s?8\d{2}\s?\d{3}\s?\d{3}$/,
    example: '+243 812 345 678',
    format: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('243') && cleaned.length === 12) {
        return `+243 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      return phone;
    }
  }
};

// Format phone number to East African format
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it starts with a country code
  for (const [countryCode, format] of Object.entries(PHONE_FORMATS)) {
    if (cleaned.startsWith(countryCode.replace('+', ''))) {
      return format.format(phone);
    }
  }
  
  // If no country code, assume Rwanda format
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `+250 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
}

// Validate phone number
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const formatted = formatPhoneNumber(phone);
  
  // Check against all East African formats
  for (const format of Object.values(PHONE_FORMATS)) {
    if (format.pattern.test(formatted)) {
      return true;
    }
  }
  
  return false;
}

// Get country code from phone number
export function getCountryCode(phone: string): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, '');
  
  for (const [countryCode] of Object.entries(PHONE_FORMATS)) {
    if (cleaned.startsWith(countryCode.replace('+', ''))) {
      return countryCode;
    }
  }
  
  return null;
}

// Get phone number examples by country
export function getPhoneExamples(): Record<string, string> {
  const examples: Record<string, string> = {};
  for (const [countryCode, format] of Object.entries(PHONE_FORMATS)) {
    examples[countryCode] = format.example;
  }
  return examples;
}
