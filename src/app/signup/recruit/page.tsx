import type { Metadata } from "next";
import RecruitSignUpForm from "@/app/ui/recruits/RecruitSignUpForm";
import { RecruitsClosed } from "@/app/ui/recruits/RecruitsClosed";
import { fetchRecruitsEnabled } from "@/app/lib/site-flags";

export const metadata: Metadata = {
  title: "Sign Up as Recruit",
};

export default async function Page() {
  // Gated on the flag itself rather than getRecruitsAccess: this form is for
  // recruits, who have no account, so there is no board exception to make.
  // Closed means the season is over and no new signups are taken.
  if (!(await fetchRecruitsEnabled())) {
    return (
      <RecruitsClosed
        title="SIGN UP"
        heading="Recruit signups are closed"
        body="We aren't taking new recruit signups right now. Check back when recruitment opens again."
      />
    );
  }

  return <RecruitSignUpForm />;
}
