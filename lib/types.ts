export type Device = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  created_at: string;
};

export type Reading = {
  id: number;
  device_id: string;
  temperature: number;
  vibration: number;
  power: number;
  created_at: string;
};

export type Alert = {
  id: number;
  device_id: string;
  metric: string;
  value: number;
  threshold: number;
  status: "open" | "acknowledged";
  created_at: string;
  devices?: { name: string } | null;
};
