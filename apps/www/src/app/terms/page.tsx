import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, LEGAL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of service" };

// Draft: have it reviewed before launch (PLAN.md §10).
export default function TermsPage() {
  return (
    <LegalPage title="Terms of service">
      <p>
        These terms apply to the IFCWise early-access service provided by {LEGAL.company} (&ldquo;we&rdquo;).
        By using the service you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        You create a public project with drawings, images or a description of a building, and we create an IFC model
        from them. During early access the service is free, offered as is, and may change or pause at any time.
        Turnaround times are targets, not guarantees. We may decline or remove any project.
      </p>

      <h2>Your files</h2>
      <ul>
        <li>
          You confirm you have the right to share every file you upload, to have a model made from it and to have
          both <strong>shown publicly</strong>.
        </li>
        <li>
          You give us a non-exclusive licence to store, process and publicly display your files and the resulting
          model on IFCWise until the project is deleted. We don&apos;t use them to train AI models.
        </li>
        <li>Don&apos;t upload confidential material or personal data of other people.</li>
      </ul>

      <h2>The models</h2>
      <p>
        Anyone may view and download public models for their own use. Models are made at LOD 100–200 from the information you provide and
        include a list of assumptions. They are not survey-accurate and must be checked by a qualified person
        before being used for design, construction, permits or cost decisions.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent permitted by law, we are not liable for indirect damage or for decisions made on the basis of
        a model. Nothing in these terms limits liability that cannot be limited under Slovenian or EU law.
      </p>

      <h2>Manage link and deletion</h2>
      <p>
        When you create a project you receive a private manage link. Anyone with it can edit or delete the project,
        so keep it safe. You can also ask us to delete a project. To report a project that infringes your rights,
        email us.
      </p>

      <h2>Privacy</h2>
      <p>
        See our <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2>Law and contact</h2>
      <p>
        Slovenian law applies. Questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
