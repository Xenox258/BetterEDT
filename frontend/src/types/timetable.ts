export type CourseColor = {
  bg: string;
  txt: string;
};

export type CoursAPIRaw = {
  id?: number | string;
  day?: string;
  start_time?: number | string;
  end_time?: number | string;
  groups?: unknown;
  module_name?: string;
  module_abbrev?: string;
  display_color_bg?: string;
  display_color_txt?: string;
  tutor_username?: string;
  room_name?: string;
  train_prog?: string;
  is_graded?: boolean;
  course_type?: string;
};

export type CoursAPI = {
  id: number;
  day: string;
  start_time: number;
  end_time: number;
  groups: string[];
  module_name: string;
  module_abbrev: string;
  display_color_bg: string;
  display_color_txt: string;
  tutor_username: string;
  room_name: string;
  train_prog: string;
  is_graded: boolean;
  course_type: string;
};

export type CourseWithPosition = CoursAPI & {
  column: number;
  totalColumns: number;
  sortedGroups: string[];
};

export type Profile = {
  id: string;
  name: string;
  dept: string;
  year: string;
  groupFilter: string;
  theme: 'light' | 'dark';
};
