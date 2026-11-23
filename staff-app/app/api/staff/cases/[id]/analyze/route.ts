import { runCaseDocumentAnalysis } from "../../../../../lib/analyze-documents";
import { caseIsVisible, getStaffIdentity, jsonError } from "../../../../../lib/staff";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaffIdentity();
    if (!staff) return jsonError("אין לך הרשאה למערכת העובדים.", 403);
    const { id } = await context.params;
    if (!(await caseIsVisible(staff, id))) return jsonError("התיק לא נמצא או שאינך משויך אליו.", 404);

    const result = await runCaseDocumentAnalysis({
      caseId: id,
      staff,
      allowAnyStatus: true,
    });

    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return Response.json({
      findingsCreated: result.findingsCreated,
      summary: result.summary,
      missingInformation: result.missingInformation,
      riskAssessment: result.riskAssessment,
    });
  } catch (error) {
    console.error("SafeDeal staff AI analysis failed", error instanceof Error && error.name === "TimeoutError" ? "timeout" : "analysis request failed");
    return jsonError("לא הצלחנו לנתח את התיק כרגע. המסמכים נשארו שמורים, ואפשר לנסות שוב.", 502);
  }
}
