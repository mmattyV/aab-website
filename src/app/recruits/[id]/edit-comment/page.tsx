import CommentUpdateForm from "@/app/ui/recruits/CommentUpdateForm";
import { auth } from "@/auth";

type PageProps = {
  params: Promise<{ id: string }>; // ✅ Explicitly treat params as a Promise
};

export default async function Page(props: PageProps) {
  const params = await props.params; // ✅ Await params
  const id = params.id;

  const session = await auth();
  if (!session || !session.user?.email || !session.user?.id) {
    console.warn("⚠️ No user session found.");
    return <div>Please log in to view recruit data.</div>;
  }

  const brotherId = session.user.id;
  console.log("Brother ID is: ", brotherId);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex overflow-hidden flex-col py-64 bg-black max-md:py-24">
        <div className="gap-2.5 self-start p-2.5 ml-12 text-9xl text-white max-md:max-w-full max-md:text-6xl max-md:ml-[22px] max-sm:text-4xl">
          EDIT COMMENT
        </div>
      </div>
      {/* Login Form: larger & moved up */}
      <div className="relative w-full flex flex-col items-center">
        {/* Negative margin to move the form up into header space */}
        <div className="mt-[-5rem] px-4 max-w-lg mx-auto w-full">
          <CommentUpdateForm recruitId={id} brotherId={brotherId} />
        </div>
      </div>
    </div>
  );
}
