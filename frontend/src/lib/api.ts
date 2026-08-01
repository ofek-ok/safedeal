// Inline types for the API module (avoids coupling to form state types)
export interface PropertyAnalysisPayload {
  location: Record<string, string>;
  details: Record<string, unknown>;
  documents: { tabuFileName: string | null; additionalDocNames: string[] };
}

export interface AnalysisResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Submit property data for analysis.
 * Returns a job ID that can be polled for status updates.
 */
export async function submitPropertyAnalysis(
  payload: PropertyAnalysisPayload
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/v1/properties/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.message ?? `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<AnalysisResponse>;
}
