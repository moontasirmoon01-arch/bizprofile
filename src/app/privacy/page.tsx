export const metadata = { title: "Privacy Policy – BizProfile" }

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: May 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
        <p className="text-sm leading-7">
          BizProfile ("we", "our", or "us") operates a social media management platform that helps
          small business owners manage their Facebook Pages, Instagram accounts, Google Business
          Profiles, and other platforms from a single dashboard. This Privacy Policy explains how
          we collect, use, and protect your information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li>Account information: name, email address, password (hashed)</li>
          <li>Business information: business name, address, category, description</li>
          <li>Platform tokens: encrypted OAuth access tokens for connected platforms (Facebook, Instagram, Google)</li>
          <li>Content: posts, product listings, campaign details you create within the app</li>
          <li>Usage data: pages visited, features used, timestamps</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Facebook and Instagram Data</h2>
        <p className="text-sm leading-7 mb-3">
          When you connect your Facebook or Instagram account, BizProfile requests the following permissions:
        </p>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li><strong>pages_show_list</strong> – to display a list of Pages you manage</li>
          <li><strong>pages_read_engagement</strong> – to read posts and engagement data from your Pages</li>
          <li><strong>pages_manage_posts</strong> – to publish posts to your Facebook Pages on your behalf</li>
        </ul>
        <p className="text-sm leading-7 mt-3">
          We only publish content that you explicitly create and approve within BizProfile. We do
          not access your personal Facebook profile, friends list, or any data beyond what is
          necessary to manage your business Pages.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
        <p className="text-sm leading-7">
          OAuth access tokens are encrypted before storage using AES encryption. We do not share
          your tokens or business data with third parties. Data is stored on secure servers and
          access is restricted to authorized personnel only.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Retention and Deletion</h2>
        <p className="text-sm leading-7">
          You may disconnect any platform at any time from the Connect page, which immediately
          deletes the associated access tokens. To delete your account and all associated data,
          contact us at the email below. We will process deletion requests within 30 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Facebook Data Deletion</h2>
        <p className="text-sm leading-7">
          In accordance with Meta's Platform Policy, users may request deletion of all Facebook-related
          data we hold. To submit a data deletion request, email us at the address below with subject
          line "Facebook Data Deletion Request". We will delete all associated tokens and data within
          30 days and confirm via email.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Third-Party Services</h2>
        <p className="text-sm leading-7">
          BizProfile integrates with Meta (Facebook/Instagram), Google, and optionally TikTok APIs.
          Your use of these platforms is also governed by their respective privacy policies.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
        <p className="text-sm leading-7">
          For privacy questions or data deletion requests, contact us at:<br />
          <strong>moontasir.moon01@gmail.com</strong>
        </p>
      </section>
    </div>
  )
}
