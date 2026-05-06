/**
 * Optional HeyGen integration (FYP). Clinical build does not ship the full client;
 * avatar "test connection" degrades gracefully.
 */
export const heygenClientService = {
  initialize(_config: {
    apiKey: string
    patientAvatarId: string
    doctorAvatarId: string
  }) {},
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "HeyGen is not configured in this application build." }
  },
}
