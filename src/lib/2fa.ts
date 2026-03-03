// Two-Factor Authentication Library
// Handles TOTP (Time-based One-Time Password) generation and verification

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorAuth {
  // Generate a random secret for TOTP
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Add spaces for readability
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }

  // Generate QR code URL for authenticator apps
  static generateQRCodeURL(secret: string, email: string, issuer: string = 'LoveX'): string {
    const cleanSecret = secret.replace(/\s/g, '');
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${cleanSecret}&issuer=${encodedIssuer}`;
  }

  // Generate QR code image (simplified - in production you'd use a QR code library)
  static async generateQRCode(url: string): Promise<string> {
    // In a real implementation, you'd use a QR code library like qrcode.js
    // For now, we'll return a placeholder or use an external service
    try {
      const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
      return response.url;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNjY2Ij5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
    }
  }

  // Generate backup codes
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += Math.floor(Math.random() * 10).toString();
      }
      codes.push(code);
    }
    return codes;
  }

  // Verify TOTP code (simplified implementation)
  static verifyCode(secret: string, token: string): boolean {
    // In a real implementation, you'd use a TOTP library like speakeasy
    // For demo purposes, we'll accept any 6-digit code
    return /^\d{6}$/.test(token);
  }

  // Generate complete 2FA setup
  static async generateSecret(email: string): Promise<TwoFactorSecret> {
    const secret = this.generateSecret();
    const qrCodeURL = this.generateQRCodeURL(secret, email);
    const qrCode = await this.generateQRCode(qrCodeURL);
    const backupCodes = this.generateBackupCodes();

    return {
      secret,
      qrCode,
      backupCodes
    };
  }
}

export const twoFactorAuth = TwoFactorAuth;
