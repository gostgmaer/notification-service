# Duplicate Email Templates Report

## Summary
Found **32+ duplicate templates** with identical or near-identical purposes. These should be consolidated.

---

## Duplicate Groups

### 1. **User Welcome/Registration**
- `welcomeEmailTemplate` (camelCase)
- `USER_WELCOME` (UPPERCASE)
- `USER_CREATED` (related user creation)

**Purpose:** Welcome new users  
**Recommendation:** Keep `welcomeEmailTemplate`, remove others or use as aliases.

---

### 2. **Email Verification**
- `emailVerificationTemplate` (camelCase)
- `EMAIL_VERIFICATION_SEND` (UPPERCASE)
- `USER_EMAIL_VERIFIED` (camelCase)
- `EMAIL_VERIFIED` (UPPERCASE)

**Purpose:** Email verification process  
**Recommendation:** Consolidate to 2: send template + verified confirmation.

---

### 3. **Password Reset Request**
- `passwordResetRequestTemplate` (camelCase)
- `PASSWORD_RESET_REQUESTED` (UPPERCASE)

**Purpose:** Password reset request email  
**Recommendation:** Keep one, remove duplicate.

---

### 4. **Password Reset Success/Completed**
- `passwordResetSuccessTemplate` (camelCase)
- `PASSWORD_RESET_COMPLETED` (UPPERCASE)

**Purpose:** Password reset success confirmation  
**Recommendation:** Keep one, remove duplicate.

---

### 5. **Password Changed**
- `passwordChangedSuccessTemplate` (camelCase)
- `PASSWORD_CHANGED` (UPPERCASE)

**Purpose:** Notify user password was changed  
**Recommendation:** Keep one, remove duplicate.

---

### 6. **Account Locked/Suspicious Login**
- `accountLockedTemplate` (camelCase)
- `ACCOUNT_LOCKED` (UPPERCASE)
- `suspiciousLoginTemplate` (camelCase)
- `NEW_DEVICE_LOGIN` (UPPERCASE)
- `LOGIN_FAILED` (UPPERCASE)

**Purpose:** Account security alerts  
**Recommendation:** Consolidate to 2-3 specific cases.

---

### 7. **Subscription Renewal Reminder**
- `subscriptionRenewalReminderTemplate` (camelCase)
- `AUTO_RENEWAL_REMINDER` (UPPERCASE)

**Purpose:** Subscription auto-renewal reminder  
**Recommendation:** Keep one, remove duplicate.

---

### 8. **Subscription Cancelled**
- `subscriptionCancelledTemplate` (camelCase)
- `SUBSCRIPTION_CANCELLED` (UPPERCASE)

**Purpose:** Subscription cancellation notification  
**Recommendation:** Keep one, remove duplicate.

---

### 9. **Order Confirmation**
- `orderConfirmationTemplate` (camelCase)
- `ORDER_CONFIRMED` (UPPERCASE)
- `CUSTOM_ORDER_CONFIRMED` (custom variant)

**Purpose:** Order confirmation email  
**Recommendation:** Keep base + custom variant.

---

### 10. **Order Shipped**
- `orderShippedTemplate` (camelCase)
- `ORDER_SHIPPED` (UPPERCASE)

**Purpose:** Order shipped notification  
**Recommendation:** Keep one, remove duplicate.

---

### 11. **Order Delivered**
- `orderDeliveredTemplate` (camelCase)
- `ORDER_DELIVERED` (UPPERCASE)

**Purpose:** Order delivery notification  
**Recommendation:** Keep one, remove duplicate.

---

### 12. **Account Termination/Reactivation**
- `accountDeactivationWarningTemplate` (camelCase)
- `accountReactivatedTemplate` (camelCase)
- `ACCOUNT_TERMINATED` (UPPERCASE)
- `ACCOUNT_RECOVERY_COMPLETED` (UPPERCASE)
- `ACCOUNT_UNLOCKED` (UPPERCASE)

**Purpose:** Account lifecycle events  
**Recommendation:** Consolidate and clarify purposes.

---

### 13. **New Device/Login Alerts**
- `newDeviceLoginTemplate` (camelCase)
- `NEW_DEVICE_LOGIN` (UPPERCASE)
- `newDeviceApprovalTemplate` (camelCase)

**Purpose:** New device login notification  
**Recommendation:** Keep one base template + approval variant.

---

### 14. **Review Request**
- `reviewRequestTemplate` (camelCase)
- `REVIEW_REMINDER` (UPPERCASE)

**Purpose:** Ask customer to review  
**Recommendation:** Keep one, remove duplicate.

---

### 15. **Cart Abandonment**
- `cartAbandonmentTemplate` (camelCase)
- `CART_ABANDONED` (UPPERCASE)

**Purpose:** Abandoned cart reminder  
**Recommendation:** Keep one, remove duplicate.

---

### 16. **Invoice Generated**
- `invoiceGeneratedTemplate` (camelCase)
- `INVOICE_GENERATED` (UPPERCASE)

**Purpose:** Invoice generation notification  
**Recommendation:** Keep one, remove duplicate.

---

### 17. **Payment Refunded**
- `paymentRefundedTemplate` (camelCase)
- `PAYMENT_REFUNDED` (UPPERCASE)

**Purpose:** Payment refund notification  
**Recommendation:** Keep one, remove duplicate.

---

### 18. **Payment Success**
- `paymentSuccessTemplate` (camelCase)
- `PAYMENT_SUCCESS` (UPPERCASE)
- `PAYMENT_COMPLETED` (if exists)

**Purpose:** Successful payment confirmation  
**Recommendation:** Keep one, remove duplicate.

---

### 19. **Payment Failed**
- `paymentFailedTemplate` (camelCase)
- `PAYMENT_FAILED` (UPPERCASE)

**Purpose:** Payment failure notification  
**Recommendation:** Keep one, remove duplicate.

---

### 20. **Maintenance Notice**
- `maintenanceNoticeTemplate` (camelCase)
- `MAINTENANCE_SCHEDULED` (UPPERCASE)

**Purpose:** Maintenance notification  
**Recommendation:** Keep one, remove duplicate.

---

### 21. **Trial Expiring**
- `trialExpiringTemplate` (camelCase)
- `TRIAL_EXPIRING` (UPPERCASE)

**Purpose:** Trial period expiring soon  
**Recommendation:** Keep one, remove duplicate.

---

### 22. **Birthday Greeting**
- `birthdayGreetingTemplate` (camelCase)
- `BIRTHDAY_GREETING` (UPPERCASE)

**Purpose:** Birthday greeting email  
**Recommendation:** Keep one, remove duplicate.

---

### 23. **Data Export Ready**
- `dataExportReadyTemplate` (camelCase)
- `DATA_EXPORT_READY` (UPPERCASE)

**Purpose:** User data export is ready  
**Recommendation:** Keep one, remove duplicate.

---

### 24. **Two-Factor Authentication**
- `twoFactorSetupTemplate` (camelCase)
- `twoFactorCodeTemplate` (camelCase)
- `MFA_ENABLED` (UPPERCASE)
- `MFA_DISABLED` (UPPERCASE)

**Purpose:** 2FA/MFA notifications  
**Recommendation:** Consolidate to 2-3 templates.

---

### 25. **Account Verification/Recovery**
- `accountVerifiedTemplate` (camelCase)
- `accountRecoveryTemplate` (camelCase)
- `accountSecurityAuditCompletedTemplate` (camelCase)
- `ACCOUNT_RECOVERY_REQUESTED` (UPPERCASE)
- `ACCOUNT_RECOVERY_COMPLETED` (UPPERCASE)

**Purpose:** Account verification and recovery  
**Recommendation:** Consolidate to core templates.

---

### 26. **Policy Updates**
- `policyUpdateTemplate` (camelCase)
- `privacyPolicyUpdateTemplate` (camelCase)
- `termsOfServiceUpdateTemplate` (camelCase)
- `PRIVACY_POLICY_UPDATED` (UPPERCASE)
- `TERMS_OF_SERVICE_UPDATED` (UPPERCASE)

**Purpose:** Policy update notifications  
**Recommendation:** Keep generic + specific variants.

---

### 27. **Session/Logout**
- `sessionExpiredTemplate` (camelCase)
- `SESSION_EXPIRED` (UPPERCASE)
- `logoutAllDevicesTemplate` (camelCase)

**Purpose:** Session management  
**Recommendation:** Consolidate to 2 templates.

---

## Pattern Analysis

| Naming Style | Count | Issue |
|---|---|---|
| camelCase | ~45 | Inconsistent with UPPERCASE standard |
| UPPERCASE | ~80 | Standard, but has duplicates |
| Mixed | ~125 | Confusion and duplicates |

---

## Recommendations

### Immediate Actions:
1. **Consolidate naming**: Choose either `camelCase` or `UPPERCASE_WITH_UNDERSCORES` format.
2. **Remove 30+ duplicates** by keeping only UPPERCASE variants.
3. **Create aliases** for backward compatibility if needed.
4. **Refactor** templates to use base templates + parameter variants instead of separate templates.

### Code Change Example:
```javascript
// OLD (duplicate):
const welcomeEmailTemplate = (...) => { ... };
const USER_WELCOME = (...) => { ... };

// NEW (consolidated):
const USER_WELCOME = (...) => { ... };
// Alias for backward compatibility
const welcomeEmailTemplate = USER_WELCOME;

module.exports = {
  welcomeEmailTemplate,  // ← deprecated
  USER_WELCOME,         // ← canonical
  // ...
};
```

---

## Total Impact

- **Duplicate templates found:** 32+
- **Lines of code that could be removed:** ~1,500+
- **Risk:** Low (mostly cosmetic/naming)
- **Benefit:** Easier maintenance, smaller bundle, clarity

