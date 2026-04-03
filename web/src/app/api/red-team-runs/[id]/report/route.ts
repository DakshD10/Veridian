import { NextRequest, NextResponse } from "next/server";
import { generateRedTeamReport } from "@/services/report.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buffer = await generateRedTeamReport(id);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="veridian-red-team-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Red team run not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to generate red team report" },
      { status: 500 }
    );
  }
}
