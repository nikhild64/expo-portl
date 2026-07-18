import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Text, IconSymbol } from '@/components';
import { useLocale } from '@/hooks/useLocale';

export default function TermsOfService() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  return (
    <Screen scroll>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        className="mb-xs h-10 w-10 items-center justify-center self-start rounded-pill border border-border bg-surface-tertiary"
        style={{ marginTop: insets.top > 0 ? 0 : 8 }}
        hitSlop={8}
      >
        <IconSymbol name="arrow_back" size={20} color="textPrimary" />
      </Pressable>

      <View className="gap-md pb-xl">
        <Text variant="titleLarge">{t('auth.signUp.termsOfService')}</Text>
        <Text variant="caption" color="textTertiary">
          Last Updated: July 18, 2026
        </Text>

        <Text variant="body" color="textSecondary" selectable>
          {"Welcome to "}
          <Text variant="body" color="textPrimary" className="font-semibold">Portl Society</Text>
          {". Please read these Terms of Service (\"Terms\") carefully before using the Portl Society mobile application (the \"App\") operated by Nikhil Dhawan (\"we\", \"us\", or \"our\")."}
        </Text>

        <Text variant="body" color="textSecondary" selectable>
          By accessing or using the App, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access or use the App.
        </Text>

        <View className="h-[1px] bg-border my-sm" />

        {/* Section 1 */}
        <Text variant="subhead" color="coral" className="font-semibold">
          1. Acceptance of Terms & Eligibility
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          By creating an account, you represent that you are at least 18 years of age (or the age of majority in your jurisdiction) and possess the legal authority to agree to these Terms. You agree to use the App solely for lawful community and society operations in accordance with these Terms and any rules established by your residential society or apartment association.
        </Text>

        {/* Section 2 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          2. User Accounts & Verification
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          To access the App, you must register for an account by providing accurate and complete information, including your full name, email address, phone number, and residential details (such as society name, wing, and flat number).
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Security:</Text> You are solely responsible for maintaining the confidentiality of your account credentials and password.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Unauthorized Use:</Text> You agree to notify your society administrator immediately of any unauthorized use of your account or security breaches.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Approval:</Text> Full access to resident and guard features requires verification and approval by your society administrator. We reserve the right to suspend accounts that fail verification.
          </Text>
        </View>

        {/* Section 3 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          3. App Services & Roles
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          Portl Society provides features tailored to different roles:
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Residents:</Text> Can generate visitor pre-approvals (QR/SMS), approve/deny gate entries, book society amenities, file complaints, and view notices or maintenance bills.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Guards:</Text> Can register walk-in visitors, scan resident pre-approval codes, and track visitor check-ins/check-outs at the society gates.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Admins/Committee Members:</Text> Manage member roles, notice boards, settings, and view logs to maintain community operations.
          </Text>
        </View>

        {/* Section 4 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          4. Acceptable Conduct
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          You agree not to misuse the App or help anyone else do so. Specifically, you agree not to:
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • Provide false identity or flat registration details.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • Approve visitor entries for unauthorized or illegal purposes.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • File spam, abusive, or fraudulent complaints.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • Attempt to breach or bypass the security mechanisms of the App.
          </Text>
        </View>

        {/* Section 5 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          5. Payments & Billing
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          Maintenance fees, bills, and society dues payments are processed securely by a third-party payment gateway (Razorpay). 
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Information Security:</Text> We do not store or capture your banking or credit card details. All transactions are subject to the terms and privacy policy of the payment processor.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Refunds & Disputes:</Text> {"Any billing errors, refund requests, or disputes must be settled directly with your society's management committee or administration."}
          </Text>
        </View>

        {/* Section 6 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          6. Intellectual Property
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          The App and its original content, features, layout, and functionality are and will remain the exclusive property of Nikhil Dhawan. Our trademarks, logos, and service marks may not be used in connection with any product or service without our prior written consent.
        </Text>

        {/* Section 7 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          7. Disclaimer of Warranties
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          {"The App is provided on an \"AS IS\" and \"AS AVAILABLE\" basis. We make no representations or warranties of any kind, express or implied, regarding the App's operation, visitor log accuracy, availability, or compatibility with your device. We do not warrant that the App will operate uninterrupted or error-free."}
        </Text>

        {/* Section 8 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          8. Limitation of Liability
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          To the maximum extent permitted by law, Nikhil Dhawan shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses, resulting from:
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • Your use or inability to use the App.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • Any unauthorized access to or use of our servers and/or personal information stored therein.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • Security breaches or delays at your society gate.
          </Text>
        </View>

        {/* Section 9 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          9. Deactivation & Termination
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          We or your society administrator may terminate or suspend your account and access to the App immediately, without prior notice or liability, if you breach these Terms. You may delete your account at any time by contacting your society administrator or by emailing us directly.
        </Text>

        {/* Section 10 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          10. Governing Law
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any legal action or proceeding arising under these Terms will be subject to the exclusive jurisdiction of the courts located in Delhi, India.
        </Text>

        {/* Section 11 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          11. Contact Us
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          If you have any questions about these Terms, please contact us:
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">By Email:</Text> nikhild64@gmail.com
          </Text>
        </View>
      </View>
    </Screen>
  );
}
