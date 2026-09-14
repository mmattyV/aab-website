// app/recruits/[id]/page.tsx

import {
  fetchRecruitById,
  fetchUserCommentForRecruit,
  fetchAllComments,
} from "@/app/lib/data";
import { RecruitProfile } from "@/app/ui/recruits/RecruitProfile";
import { redirect } from "next/navigation";
import { getRecruitsAccess, loginRedirectFor } from "@/app/lib/board-access";
import { RecruitsClosed } from "@/app/ui/recruits/RecruitsClosed";
import { RecruitCommentProps } from "@/app/lib/definitions";

type PageProps = {
  params: Promise<{ id: string }>; // Explicitly treat params as a Promise
};

export default async function Page(props: PageProps) {
  // 2) Await the searchParams and extract the recruit ID
  const params = await props.params;
  const recruitId = params.id;

  // 1) Authenticate the user, and check recruits are open to them
  const access = await getRecruitsAccess();
  if (access.status === "signed-out") {
    redirect(loginRedirectFor(`/recruits/${recruitId}/details`));
  }
  if (access.status === "closed") {
    return <RecruitsClosed />;
  }

  const userId = access.brother.id;

  // 3) Fetch recruit profile data
  const recruitProfileData = await fetchRecruitById(recruitId);
  if (!recruitProfileData) {
    return (
      <div className="p-4 text-center text-red-500">
        Recruit profile not found.
      </div>
    );
  }

  // 4) Check if the user has left a comment on this recruit
  const userComment = await fetchUserCommentForRecruit(recruitId, userId);

  let filteredComments: RecruitCommentProps[] = [];
  if (userComment) {
    // User has commented; fetch all comments for this recruit
    const allComments = await fetchAllComments();
    filteredComments = allComments.filter(
      (comment) => comment.recruit_id === recruitId
    );
  }

  return (
    <RecruitProfile
      {...recruitProfileData}
      id={recruitId}
      comments={filteredComments}
    />
  );
}
