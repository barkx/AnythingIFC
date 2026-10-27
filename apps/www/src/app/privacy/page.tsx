import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, LEGAL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

// Draft: have it reviewed before launch (PLAN.md §10).
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        This policy explains what personal data {LEGAL.company} (&ldquo;IFCWise&rdquo;, &ldquo;we&rdquo;) collects,
        why, and what rights you have under the EU General Data Protection Regulation (GDPR).
      </p>

      <h2>Who is responsible</h2>
      <p>
        {LEGAL.company}, {LEGAL.address}. Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Projects (public):</strong> your display name, project description, the files you upload and the
          model we create. These are published for anyone to see. Legal basis: your consent when creating the
          project (Art. 6(1)(a) GDPR) and performing the service (Art. 6(1)(b) GDPR).
        </li>
        <li>
          <strong>Email address (private):</strong> stored encrypted, visible only to us, used only to tell you
          about your project. Legal basis: performing the service (Art. 6(1)(b) GDPR).
        </li>
        <li>
          <strong>Technical data:</strong> IP address and request logs needed to run the service securely.
          Legal basis: our legitimate interest in security (Art. 6(1)(f) GDPR).
        </li>
      </ul>

      <h2>Public projects</h2>
      <p>
        During early access <strong>every project is public</strong>. After we review it, the description, uploaded
        files and finished model are shown in the project gallery and can be viewed and downloaded by anyone. Don&apos;t
        upload confidential documents or drawings showing personal details such as owners&apos; names or addresses.
        Files are <strong>never used to train AI models</strong>.
      </p>

      <h2>Where your data is stored</h2>
      <p>
        The websites and all project data are hosted by Vercel (including Vercel Blob storage). We download project
        files to our own computer in Slovenia (EU) to build the models. Vercel acts as our processor under a data
        processing agreement and may process data outside the EU under the EU Standard Contractual Clauses.
      </p>

      <h2>Cookies</h2>
      <p>
        This website and the project pages set no cookies and use no tracking. Only the admin area uses a strictly
        necessary login cookie.
      </p>

      <h2>How long we keep data</h2>
      <ul>
        <li>Projects, files and models: until you delete the project with your manage link or ask us to.</li>
        <li>Email address: deleted together with the project.</li>
        <li>Server logs: as kept by Vercel, typically a few days.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You can ask for access to, correction, deletion or a copy of your data, restrict or object to processing,
        and withdraw consent at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You
        can also complain to the Slovenian Information Commissioner (Informacijski pooblaščenec, www.ip-rs.si).
      </p>
    </LegalPage>
  );
}
