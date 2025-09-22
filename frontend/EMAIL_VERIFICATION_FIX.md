# Email Verification Fix Guide

## Problem
Users are not receiving email verification when signing up for LCC Assemble.

## Root Causes & Solutions

### 1. **Firebase Console Configuration Issues**

#### A. Email Templates Not Configured
**Problem**: Firebase Auth email templates are not set up.

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lcc-assemble-49d97`
3. Navigate to **Authentication** → **Templates**
4. Configure the **Email address verification** template:
   - **From**: Set to your domain (e.g., `noreply@lcc-assemble-49d97.firebaseapp.com`)
   - **Subject**: Customize the verification email subject
   - **Message**: Customize the email content
   - **Reply-to address**: Set if needed

#### B. Domain Not Authorized for Email Sending
**Problem**: Firebase may not be authorized to send emails from your domain.

**Solution**:
1. In Firebase Console → Authentication → Settings → Authorized Domains
2. Add your domain: `lcc-assemble-49d97.firebaseapp.com`
3. Verify domain ownership if prompted

#### C. SMTP Settings (if using custom domain)
**Problem**: If using a custom domain, SMTP settings may not be configured.

**Solution**:
1. In Firebase Console → Authentication → Settings
2. Under "SMTP settings", configure your SMTP server if using custom domain
3. Test email sending functionality

### 2. **Code-Level Issues**

#### A. Enhanced Error Handling (Already Implemented)
The AuthContext now includes better error handling for email verification failures:

```typescript
// Step 4: Send email verification
try {
  await sendEmailVerification(userCredential.user)
  console.log('✅ Email verification sent successfully')
} catch (emailError: any) {
  console.error('❌ Email verification failed:', emailError)
  // Registration continues even if email fails
}
```

#### B. Development Mode Bypass (Already Configured)
For development/testing, email verification is automatically set to true:

```bash
# In .env file
VITE_SKIP_EMAIL_VERIFICATION=true
```

### 3. **Testing & Debugging**

#### A. Use the Email Verification Debugger Component
A new `EmailVerificationDebugger` component has been created to help debug email issues:

```tsx
import EmailVerificationDebugger from '../components/auth/EmailVerificationDebugger'

// Add to any page for testing
<EmailVerificationDebugger />
```

**Features**:
- Check current verification status
- Resend verification email
- Manual verification (development only)
- Display debug information

#### B. Manual Verification for Testing
For development/testing, you can manually verify emails:

```typescript
// In browser console or component
await verifyEmailManually(userId)
```

### 4. **Firebase Security Rules**

#### A. Check Firestore Rules
Ensure Firestore security rules allow user document creation:

```javascript
// In firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. **Common Issues & Solutions**

#### A. "Email Already in Use" Error
**Problem**: User tries to register with existing email.

**Solution**: Check if user already exists in Firebase Auth.

#### B. "Invalid Email" Error
**Problem**: Email format validation fails.

**Solution**: Ensure email format is valid before calling Firebase Auth.

#### C. "Too Many Requests" Error
**Problem**: Rate limiting triggered.

**Solution**: Implement exponential backoff for retry logic.

#### D. "Domain Not Authorized" Error
**Problem**: Firebase not authorized to send from domain.

**Solution**: Add domain to authorized domains in Firebase Console.

### 6. **Production Deployment Checklist**

Before deploying to production:

1. ✅ Configure email templates in Firebase Console
2. ✅ Add domain to authorized domains
3. ✅ Test email sending functionality
4. ✅ Remove development bypass (`VITE_SKIP_EMAIL_VERIFICATION=false`)
5. ✅ Set up proper SMTP if using custom domain
6. ✅ Test with real email addresses
7. ✅ Monitor email delivery rates

### 7. **Monitoring & Logging**

#### A. Add Email Event Monitoring
Monitor email events in Firebase Console:
- Authentication → Users → Email verification status
- Check Firebase logs for email sending errors

#### B. User Feedback
Provide clear feedback to users:
- "Check your email for verification link"
- "Didn't receive email? Check spam folder"
- "Click here to resend verification email"

### 8. **Alternative Solutions**

If Firebase email verification continues to fail:

#### A. Custom Email Service
- Use services like SendGrid, Mailgun, or AWS SES
- Implement custom email verification flow
- More control over email delivery

#### B. SMS Verification
- Use Firebase Phone Auth instead
- Send verification codes via SMS
- Better delivery rates than email

#### C. Third-party Auth
- Use Google, Facebook, or other OAuth providers
- Skip email verification entirely
- Users authenticate with existing accounts

## Quick Fix Summary

1. **Immediate**: Use the EmailVerificationDebugger component to test
2. **Short-term**: Configure Firebase Console email templates
3. **Long-term**: Implement proper error handling and user feedback
4. **Production**: Set up domain authorization and SMTP settings

## Contact Support

If issues persist:
1. Check Firebase Console logs
2. Verify domain settings
3. Test with different email providers
4. Consider alternative verification methods