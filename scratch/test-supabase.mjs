import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jqmlubzjqrfezsrtlrzh.supabase.co';
const supabaseAnonKey = 'sb_publishable_3V9uKeNdvJTHzTLRvEjw_g_ILviPt3Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  const testEmail = `aicareerguide_qa_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!@#';

  console.log(`[1] Testing signUp for ${testEmail}...`);
  const signUpRes = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { full_name: 'QA Tester', plan: 'free' }
    }
  });

  console.log('SignUp Result:', {
    user: signUpRes.data?.user?.id,
    session: !!signUpRes.data?.session,
    error: signUpRes.error?.message
  });

  console.log(`[2] Testing signInWithPassword for ${testEmail}...`);
  const signInRes = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  console.log('SignIn Result:', {
    user: signInRes.data?.user?.id,
    session: !!signInRes.data?.session,
    error: signInRes.error?.message
  });
}

testAuth();
