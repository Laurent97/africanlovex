# Flutterwave Payment Integration Setup

This document explains how to set up and use the Flutterwave payment integration in the LoveX dating application.

## 🚀 Features Implemented

### ✅ Payment Methods
- **Credit/Debit Cards**: Visa, Mastercard, American Express
- **Mobile Money**: MTN MoMo, Airtel Money, M-Pesa (East Africa)
- **Bank Transfers**: Direct bank withdrawals

## 🔧 Recent Fixes (March 2026)

1. **Browser Compatibility**: Replaced `flutterwave-node-v3` with browser-compatible fetch API implementation
2. **Database Schema**: Fixed column name from `coin_balance` to `coins_balance`
3. **CORS Issues**: Created backend API endpoints to avoid direct Flutterwave API calls from browser
4. **Missing Tables**: Created migration for payment system tables

## 📋 Database Migration

The payment system requires database tables to be created. Please run the following SQL in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20240101000001_payment_system.sql`
4. Click "Run" to execute the migration

## 🔑 Environment Variables

Make sure you have the following environment variables in your `.env` file:

```env
# Flutterwave Configuration
VITE_FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret

# Application URLs
VITE_APP_URL=http://localhost:5173
APP_URL=http://localhost:5173
```

## 🌐 API Endpoints Created

- `GET /api/flutterwave/banks` - Get list of banks (proxied to avoid CORS)
- `POST /api/payments/mobile-money/initiate` - Initiate mobile money payment
- `GET /api/payments/verify/[transactionId]` - Verify payment status
- `POST /api/withdrawals` - Initiate withdrawal

## ⚠️ Important Notes

- All Flutterwave API calls now go through backend endpoints to avoid CORS issues
- Database migration is required before testing payments
- Make sure to run the migration in Supabase before proceeding
- **Cryptocurrency**: BTC, ETH, USDT, BNB (future implementation)

### ✅ Core Functionality
- Real-time payment processing
- Transaction verification and status polling
- Automatic balance updates
- Withdrawal processing to bank accounts
- Account verification for bank transfers
- Comprehensive transaction history
- Multi-currency support (USD, RWF, KES, UGX, TZS)

## 📋 Prerequisites

### 1. Flutterwave Account
1. Sign up at [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Get your API keys from Settings → API Keys
3. Note down:
   - Public Key
   - Secret Key  
   - Encryption Key

### 2. Environment Variables
Add the following to your `.env` file:

```env
# Flutterwave Configuration
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxxxxxxxxxxxxxxxxxx-X
FLUTTERWAVE_ENCRYPTION_KEY=your-encryption-key-here
FLUTTERWAVE_WEBHOOK_SECRET=your-webhook-secret-hash

# Application URL (important for callbacks)
VITE_APP_URL=http://localhost:5173  # Development
# VITE_APP_URL=https://your-domain.com  # Production
```

## 🔧 Installation

1. **Install Flutterwave SDK** (already done):
```bash
npm install flutterwave-node-v3
```

2. **Environment Setup**:
   - Copy `.env.example` to `.env`
   - Fill in your Flutterwave credentials

## 📱 Usage Guide

### Buying Coins (Deposits)

1. Navigate to `/wallet`
2. Click on "Buy Coins" tab
3. Select a coin package
4. Choose payment method:
   - **Card**: Redirects to Flutterwave secure checkout
   - **Mobile Money**: Enter phone number, complete on phone
5. Complete payment
6. Coins are automatically added to your wallet

### Withdrawing Funds

1. Navigate to `/wallet`
2. Click "Withdraw" button
3. Enter withdrawal amount (in USD)
4. Choose withdrawal method:
   - **Bank Transfer**: Select bank, enter account number, verify
   - **Mobile Money**: Select network, enter phone number
5. Confirm withdrawal
6. Funds are processed (1-3 business days)

### Transaction History

- View all transactions in "Transaction History" tab
- Filter by type, date range, or search
- Real-time status updates
- Export functionality available

## 🏗️ Architecture

### Frontend Components
- `Wallet.tsx` - Main wallet interface
- `PaymentCallback.tsx` - Handles payment redirects
- `flutterwave.service.ts` - Flutterwave API integration

### API Layer
- `src/api/payments.ts` - Payment API functions
- Mock implementations for development
- Real Flutterwave integration for production

### Database Tables
- `payment_transactions` - Payment records
- `coin_transactions` - Coin movements
- `withdrawal_requests` - Withdrawal tracking

## 🔒 Security Features

### 1. Transaction Verification
- Server-side verification with Flutterwave
- Status polling to prevent fraud
- Webhook signature validation

### 2. Account Verification
- Bank account number validation
- Account name verification
- Phone number verification for mobile money

### 3. Rate Limiting
- Payment retry limits
- Daily withdrawal limits
- Fraud detection patterns

## 🌍 East African Mobile Money Support

### Supported Networks
- **Rwanda**: MTN MoMo, Airtel Money
- **Kenya**: M-Pesa, Airtel Money
- **Uganda**: MTN MoMo, Airtel Money
- **Tanzania**: M-Pesa, Tigo Pesa, Halopesa
- **DRC**: Airtel Money, Orange Money

### Currency Support
- **RWF** (Rwandan Franc) - Default
- **KES** (Kenyan Shilling)
- **UGX** (Ugandan Shilling)
- **TZS** (Tanzanian Shilling)
- **CDF** (Congolese Franc)

## 🧪 Testing

### Development Mode
1. Use Flutterwave test keys
2. Test with sandbox environment
3. Mock successful/failed transactions

### Test Cards
Use Flutterwave test cards for card payments:
- **Successful**: `5189 0423 3535 6656`
- **Failed**: `5189 0423 3535 6657`

### Mobile Money Testing
- Use real phone numbers in sandbox
- Test with small amounts
- Verify webhook delivery

## 🚀 Deployment

### Production Setup
1. Update environment variables with production keys
2. Set `VITE_APP_URL` to your domain
3. Configure webhook endpoints
4. Enable SSL certificate
5. Test live payments

### Webhook Configuration
Set up webhook at: `https://your-domain.com/api/payments/webhook`
- Listen for payment completion events
- Update user balances automatically
- Send confirmation notifications

## 📊 Monitoring

### Key Metrics
- Payment success rate
- Transaction processing time
- Mobile money vs card usage
- Withdrawal processing time
- Failed transaction reasons

### Error Handling
- Automatic retry for failed payments
- User-friendly error messages
- Support contact information
- Fallback payment methods

## 🔧 Troubleshooting

### Common Issues

1. **Payment Failed**
   - Check API keys are correct
   - Verify webhook configuration
   - Check network connectivity

2. **Mobile Money Not Working**
   - Verify phone number format
   - Check network coverage
   - Ensure sufficient funds

3. **Withdrawal Issues**
   - Verify bank account details
   - Check withdrawal limits
   - Contact bank if needed

### Debug Mode
Enable debug logging:
```env
VITE_DEBUG_PAYMENTS=true
```

## 📞 Support

### Flutterwave Support
- Email: developers@flutterwave.com
- Documentation: https://developer.flutterwave.com/
- Status Page: https://status.flutterwave.com/

### LoveX Support
- In-app support chat
- Email: support@lovex.rw
- Phone: +250 788 123 456

## 🔄 Future Enhancements

### Planned Features
- [ ] USSD payments for basic phones
- [ ] QR code payments
- [ ] Recurring payments for subscriptions
- [ ] Multi-currency wallet
- [ ] Payment analytics dashboard
- [ ] Advanced fraud detection

### API v3 Integration
- Upgrade to latest Flutterwave API
- Implement new payment methods
- Enhanced security features
- Better error handling

## 📝 License

This Flutterwave integration follows Flutterwave's terms of service and API usage guidelines. Ensure compliance with local financial regulations in your operating regions.

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Compatibility**: Flutterwave API v3
