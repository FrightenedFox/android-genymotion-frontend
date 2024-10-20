export interface InstanceInfo {
  instance_id: string;
  instance_type: string;
  instance_state: string | null;
  instance_ip: string | null;
  instance_aws_address: string | null;
}

export interface Session {
  PK: string;
  SK: string;
  instance: InstanceInfo | null;
  ssl_configured: boolean;
  ami_id: string;
  user_ip: string | null;
  browser_info: string | null;
  start_time: string;
  end_time: string | null;
  instance_active: boolean | null;
  last_accessed_on: string | null; 
  scheduled_for_deletion: boolean | null;
}

export interface SessionPing {
  PK: string;
  SK: string;
  instance_active: boolean;
  last_accessed_on: string;
  scheduled_for_deletion: boolean;
}


export interface AMI {
  PK: string;
  SK: string;
  representing_year: number;
  instance_type: string;
  disk_size: number;
  android_version: string;
  screen_width: number;
  screen_height: number;
}

export interface Game {
  PK: string;
  SK: string;
  name: string;
  game_version: string;
  android_package_name: string;
  apk_s3_path: string | null;
  wifi_enabled: boolean;
  screen_orientation: "horizontal" | "vertical";
}
