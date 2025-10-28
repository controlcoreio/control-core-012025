export interface SignupData {
  name: string;
  job_title: string;
  company_name: string;
  company_email: string;
  subscription_tier: 'kickstart' | 'custom' | 'pro';
  billing_cycle: 'monthly' | 'annual';
  skip_payment: boolean;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  industry?: string;
  team_size?: string;
  hear_about_us?: string;
  payment_method_type?: 'card' | 'ach';
  stripe_payment_method_id?: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

export interface SignupResponse {
  user_id: string;
  email: string;
  company_name: string;
  subscription_tier: string;
  billing_cycle: string;
  requires_payment: boolean;
  trial_end?: string;
  next_steps: string[];
}

export interface DownloadPackage {
  package_id: string;
  package_type: string;
  package_format: string;
  download_url: string;
  file_size: number;
  components: string[];
  requirements: Record<string, string>;
}

export interface DownloadResponse {
  user_id: string;
  packages: DownloadPackage[];
}
