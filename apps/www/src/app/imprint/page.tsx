import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, LEGAL } from "@/lib/site";

export const metadata: Metadata = { title: "Imprint" };

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <p>
        <strong>{LEGAL.company}</strong>
        <br />
        {LEGAL.address}
        <br />
        VAT ID: {LEGAL.vatId}
        <br />
        Email: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
