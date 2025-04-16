// app/api/comments/route.ts
import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Define types for our data
type RecruitComment = {
  recruitName: string;
  comment: string;
};

type BrotherComments = {
  brotherName: string;
  comments: RecruitComment[];
};

// Function to format the data into the desired text format.
function formatComments(data: BrotherComments[]): string {
  return data
    .map((brother) => {
      const header = `Brother Name: ${brother.brotherName}`;
      const commentLines = brother.comments
        .map((c) => `* ${c.recruitName}: ${c.comment}`)
        .join("\n\n");
      return `${header}\n\n${commentLines}`;
    })
    .join("\n\n\n");
}

export async function GET() {
  try {
    // Query the database for comments along with brother and recruit names.
    const result = await sql`
      SELECT 
        b.brother_name AS brother_name,
        (r.first_name || ' ' || r.last_name) AS recruit_name,
        rc.comment
      FROM recruit_comments AS rc
      JOIN brothers AS b ON b.id = rc.brother_id
      JOIN recruits AS r ON r.id = rc.recruit_id
      ORDER BY b.brother_name, r.first_name, r.last_name
    `;

    // Explicitly cast result.rows to our expected type.
    const rows = result.rows as { brother_name: string; recruit_name: string; comment: string }[];

    // Group comments by brother's name.
    const commentsByBrother: Record<string, RecruitComment[]> = {};

    for (const row of rows) {
      const { brother_name, recruit_name, comment } = row;
      if (!commentsByBrother[brother_name]) {
        commentsByBrother[brother_name] = [];
      }
      commentsByBrother[brother_name].push({
        recruitName: recruit_name,
        comment,
      });
    }

    // Convert the grouped object into an array of BrotherComments.
    const output: BrotherComments[] = Object.keys(commentsByBrother).map((brotherName) => ({
      brotherName,
      comments: commentsByBrother[brotherName],
    }));

    // Format the array into a nice text string.
    const formattedText = formatComments(output);

    // Return the formatted text as plain text.
    return new NextResponse(formattedText, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Error fetching brother comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch brother comments" },
      { status: 500 }
    );
  }
}