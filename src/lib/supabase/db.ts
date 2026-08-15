import { createClient } from './client'

export const supabaseDb = {
  // Profiles
  async getProfile(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateProfile(userId: string, updates: Record<string, any>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Resumes
  async getResumes(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(r => ({
      ...r,
      templateId: r.template_id,
      userId: r.user_id,
      plainText: r.plain_text,
      atsScore: r.ats_score,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  },

  async getResume(id: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return {
      ...data,
      templateId: data.template_id,
      userId: data.user_id,
      plainText: data.plain_text,
      atsScore: data.ats_score,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async saveResume(userId: string, resume: Record<string, any>) {
    const supabase = createClient()
    const resumeId = resume.id

    const payload = {
      user_id: userId,
      name: resume.name || 'My Professional CV',
      template_id: resume.templateId || resume.template_id || 'modern',
      content: resume.content || resume,
      plain_text: resume.plainText || resume.plain_text || '',
      ats_score: resume.atsScore || resume.ats_score || null,
      updated_at: new Date().toISOString(),
    }

    if (resumeId) {
      const { data, error } = await supabase
        .from('resumes')
        .update(payload)
        .eq('id', resumeId)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('resumes')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async deleteResume(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('resumes').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // Job Applications (Tracker)
  async getJobApplications(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(j => ({
      ...j,
      userId: j.user_id,
      jobDescription: j.job_description,
      sourceUrl: j.source_url,
      listingFingerprint: j.listing_fingerprint,
      createdAt: j.created_at,
      updatedAt: j.updated_at,
    }))
  },

  async createJobApplication(userId: string, application: Record<string, any>) {
    const supabase = createClient()
    const payload = {
      user_id: userId,
      company: application.company || 'Unknown Company',
      role: application.role || application.position || 'Unknown Role',
      location: application.location || '',
      status: application.status || 'saved',
      source: application.source || 'manual',
      source_url: application.sourceUrl || application.source_url || '',
      job_description: application.jobDescription || application.job_description || '',
      listing_fingerprint: application.listingFingerprint || application.listing_fingerprint || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('job_applications')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateJobApplication(id: string, updates: Record<string, any>) {
    const supabase = createClient()
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (updates.company !== undefined) payload.company = updates.company
    if (updates.role !== undefined || updates.position !== undefined) payload.role = updates.role || updates.position
    if (updates.location !== undefined) payload.location = updates.location
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.source !== undefined) payload.source = updates.source
    if (updates.sourceUrl !== undefined || updates.source_url !== undefined) payload.source_url = updates.sourceUrl || updates.source_url
    if (updates.jobDescription !== undefined || updates.job_description !== undefined) payload.job_description = updates.jobDescription || updates.job_description

    const { data, error } = await supabase
      .from('job_applications')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteJobApplication(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) throw error
    return true
  },

  // Cover Letters
  async getCoverLetters(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data || []).map(c => ({
      ...c,
      userId: c.user_id,
      jobTitle: c.job_title,
      companyName: c.company_name,
      jobDescription: c.job_description,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))
  },

  async saveCoverLetter(userId: string, coverLetter: Record<string, any>) {
    const supabase = createClient()
    const id = coverLetter.id
    const payload = {
      user_id: userId,
      job_title: coverLetter.jobTitle || coverLetter.job_title || 'Application',
      company_name: coverLetter.companyName || coverLetter.company_name || 'Company',
      content: coverLetter.content || '',
      job_description: coverLetter.jobDescription || coverLetter.job_description || '',
      updated_at: new Date().toISOString(),
    }

    if (id) {
      const { data, error } = await supabase
        .from('cover_letters')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('cover_letters')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    }
  },

  async deleteCoverLetter(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('cover_letters').delete().eq('id', id)
    if (error) throw error
    return true
  },
}
