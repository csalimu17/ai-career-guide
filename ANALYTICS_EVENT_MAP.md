# Ethical conversion analytics event map

Use the existing Google Analytics integration only. Never include CV text, job descriptions, email addresses, names, account IDs, filenames, passwords, provider errors or free-form form values.

| Event | Trigger | Route family | Safe properties | Stage |
| --- | --- | --- | --- | --- |
| `marketing_page_viewed` | Public page becomes visible | Public | `page_group`, `route` | Understand |
| `primary_cta_clicked` | Canonical Build My CV Free | Public | `route`, `placement`, `intent` | Start |
| `secondary_cta_clicked` | Upload, ATS, plans or login action | Public | `route`, `placement`, `intent` | Start |
| `template_selected` | Use/preview a template | Templates | `template_id`, `access_tier`, `action` | Consider |
| `ats_flow_started` | Check My CV or ATS form opened | ATS | `entry_route`, `authenticated` | Activate |
| `cv_upload_started` | File picker receives a valid file | Upload | `file_type`, `size_bucket` | Activate |
| `signup_started` | Signup form first interaction | Signup | `entry_intent`, `auth_method` | Register |
| `signup_completed` | Authentication succeeds | Signup | `entry_intent`, `auth_method` | Register |
| `signup_failed` | Authentication returns a handled error | Signup | `error_category`, `auth_method` | Register |
| `login_completed` | Login succeeds | Login | `entry_intent`, `auth_method` | Return |
| `onboarding_started` | First onboarding screen | Onboarding | `entry_intent` | Activate |
| `onboarding_completed` | Onboarding is persisted | Onboarding | `entry_intent` | Activate |
| `first_cv_created` | First new CV persists | Editor | `template_id` | Value |
| `first_cv_imported` | First parsed CV persists | Upload/editor | `file_type` | Value |
| `first_ats_scan_completed` | First successful real result persists | ATS | `input_mode` | Value |
| `pricing_plan_selected` | Pro/Master CTA | Pricing | `plan_id`, `placement` | Monetise |
| `checkout_started` | Stripe test/live checkout session succeeds | Settings | `plan_id` | Monetise |
| `checkout_completed` | Verified webhook updates entitlement | Server | `plan_id` | Monetise |

Components expose stable placement and intent attributes so a future experiment can vary copy/layout without inventing a client-side testing platform.
