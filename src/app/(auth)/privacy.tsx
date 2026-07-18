import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Text, IconSymbol } from '@/components';
import { useLocale } from '@/hooks/useLocale';

export default function PrivacyPolicy() {
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
        <Text variant="titleLarge">{t('auth.signUp.privacyPolicy')}</Text>
        <Text variant="caption" color="textTertiary">
          Last Updated: July 18, 2026
        </Text>

        <Text variant="body" color="textSecondary" selectable>
          {"Nikhil Dhawan (\"we\", \"us\", or \"our\") operates the "}
          <Text variant="body" color="textPrimary" className="font-semibold">Portl Society</Text>
          {" mobile application (the \"App\"). We are committed to protecting your privacy and ensuring you have a positive experience when using our App."}
        </Text>

        <Text variant="body" color="textSecondary" selectable>
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this Privacy Policy carefully. By using the App, you agree to the collection and use of information in accordance with this policy.
        </Text>

        <Text variant="body" color="textSecondary" selectable>
          If you do not agree with the terms of this Privacy Policy, please do not access or use the App.
        </Text>

        <View className="h-[1px] bg-border my-sm" />

        {/* Section 1 */}
        <Text variant="subhead" color="coral" className="font-semibold">
          1. Information We Collect
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          We collect several different types of information for various purposes to provide and improve our service to you.
        </Text>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            A. Personal Data
          </Text>
          <Text variant="body" color="textSecondary" className="pl-xs" selectable>
            While using our App, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you:
          </Text>
          <View className="gap-xxs pl-md">
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">User Accounts:</Text> Name, email address, phone number, and account credentials (managed securely via Supabase Auth).
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Community Profiles:</Text> Society/apartment name, block, flat/apartment number, and role within the society (e.g., Resident, Guard, Committee Member, or Admin).
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Visitor Records:</Text> When residents or guards log visitors, we collect visitor names, phone numbers, vehicle registration numbers (if applicable), purpose of visit, and entry/exit timestamps.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Support & Communication:</Text> Information you provide when raising complaints, booking amenities, or communicating with society admins or support.
            </Text>
          </View>
        </View>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            B. Device and Usage Data
          </Text>
          <Text variant="body" color="textSecondary" className="pl-xs" selectable>
            When you access the App via a mobile device, we may collect certain information automatically, including:
          </Text>
          <View className="gap-xxs pl-md">
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Device Info:</Text> Device type, operating system version, unique device identifiers, and IP address.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Usage Stats:</Text> Information about how you interact with the App (e.g., screens viewed, actions taken).
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Push Notification Tokens:</Text> We collect push token identifiers to deliver real-time notifications about visitor entries, approvals, society notices, and billing alerts.
            </Text>
          </View>
        </View>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            C. Permissions & Native Device Access
          </Text>
          <Text variant="body" color="textSecondary" className="pl-xs" selectable>
            To function correctly, the App requires access to certain features on your mobile device:
          </Text>
          <View className="gap-xxs pl-md">
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Camera Access:</Text> Used primarily by the Guard role to scan QR codes for resident-approved visitor entry. It may also be used by residents to scan codes or upload photos/attachments (e.g., profile pictures or complaint proof).
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Notifications:</Text> Used to send push alerts (e.g., when a visitor arrives at the gate, or when a society notice is published).
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Storage/Files:</Text> Used to download or upload attachments (e.g., amenity booking confirmations, billing receipts, or complaint photos).
            </Text>
          </View>
        </View>

        {/* Section 2 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          2. Use of Your Data
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          We use the collected data for various purposes:
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Core Functionality:</Text> To manage society operations, authorize visitor entries, coordinate bookings, and process complaints.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Security & Authentication:</Text> To verify user identities, authenticate login credentials, and prevent unauthorized access to residential premises.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Push Notifications:</Text> To notify residents instantly when a guard scans a QR code, a visitor requests entry, or billing notices are updated.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Payment Processing:</Text> To facilitate the payment of society maintenance fees and dues.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">App Performance & Maintenance:</Text> To monitor usage, detect/diagnose crashes, and optimize performance.
          </Text>
        </View>

        {/* Section 3 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          3. Sharing & Disclosure of Your Data
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          We do not sell, trade, or rent your Personal Data to third parties. We may share information in the following situations:
        </Text>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            A. Within the Society Community
          </Text>
          <View className="gap-xxs pl-md">
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">To Society Admins/Committee Members:</Text> Society administrators have access to flat lists, resident directories, visitor logs, dues statuses, and complaints to run the community control center.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">To Gate Security Guards:</Text> Guards can view visitor approvals, scan pre-approval QR codes, and log visitor details.
            </Text>
          </View>
        </View>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            B. Third-Party Service Providers
          </Text>
          <Text variant="body" color="textSecondary" className="pl-xs" selectable>
            We employ third-party companies and tools to facilitate our App and perform service-related operations. These processors have access to your data only to perform tasks on our behalf and are obligated not to disclose or use it for any other purpose:
          </Text>
          <View className="gap-xxs pl-md">
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Authentication and Database (Supabase):</Text> Used for user authentication, hosting, database storage, and executing cloud functions.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Payments (Razorpay):</Text> Used to process maintenance fees and dues payments. We do not store or capture your banking or credit card credentials; all transactional details are securely handled directly by Razorpay in compliance with industry standards.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Push Notifications (Firebase Cloud Messaging / Google Play Services):</Text> Used to route and deliver push notifications to Android devices.
            </Text>
            <Text variant="body" color="textSecondary" selectable>
              • <Text variant="body" color="textPrimary" className="font-semibold">Crash Reporting & Diagnostics (Sentry):</Text> Used to capture error logs and crash diagnostics to help us troubleshoot and improve stability.
            </Text>
          </View>
        </View>

        <View className="gap-xs pl-sm">
          <Text variant="body" color="textPrimary" className="font-semibold">
            C. Legal Requirements
          </Text>
          <Text variant="body" color="textSecondary" className="pl-xs" selectable>
            We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
          </Text>
        </View>

        {/* Section 4 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          4. Security of Your Data
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          The security of your data is important to us. We employ industry-standard security measures (including secure HTTPS communication, SSL encryption, and Row-Level Security (RLS) policies on Supabase) to protect your personal information. However, please remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
        </Text>

        {/* Section 5 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          5. Data Retention & Deletion
        </Text>
        <View className="gap-xxs pl-md">
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Account Info:</Text> Retained for as long as your account is active and you remain a resident of the registered society.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">Visitor Logs:</Text> Retained in accordance with society guidelines and local safety regulations.
          </Text>
          <Text variant="body" color="textSecondary" selectable>
            • <Text variant="body" color="textPrimary" className="font-semibold">User-Initiated Deletion:</Text> You can request the deletion of your account and personal data at any time by contacting your society administrator or by emailing us directly at the contact address below. Upon verification, we will purge your personal information from our active databases, subject to any legal retention requirements.
          </Text>
        </View>

        {/* Section 6 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          {"6. Children's Privacy"}
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          Our services are not designed for or directed at children under the age of 13. We do not knowingly collect personal information from children. If we discover that a child under 13 has provided us with personal details, we will delete it immediately. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
        </Text>

        {/* Section 7 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          7. Changes to This Privacy Policy
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          {"We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date at the top. You are advised to review this Privacy Policy periodically for any changes."}
        </Text>

        {/* Section 8 */}
        <Text variant="subhead" color="coral" className="font-semibold mt-sm">
          8. Contact Us
        </Text>
        <Text variant="body" color="textSecondary" selectable>
          If you have any questions or suggestions about this Privacy Policy, do not hesitate to contact us:
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
