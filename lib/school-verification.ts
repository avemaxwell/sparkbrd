import type { SupabaseClient } from '@supabase/supabase-js';
import { deriveInstitutionName } from '@/lib/educator';

// Shared by the token-confirm route and the OAuth-link route — both end up
// writing the same denormalized "current verification" fields onto
// profiles once ownership of an institutional email is proven.
export async function finalizeVerification(
  admin: SupabaseClient,
  userId: string,
  email: string,
  domain: string,
) {
  const institutionName = deriveInstitutionName(domain);

  await admin
    .from('profiles')
    .update({
      is_verified_educator: true,
      verified_school_domain: domain,
      verified_institution_name: institutionName,
      verified_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { domain, institutionName };
}
