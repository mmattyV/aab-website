// This file contains type definitions for our data
export type Brother = {
  id: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  password: string;
  school_email: string;
  brother_name: string;
  house: string;
  year: number;
  birthday: string;
  location: string;
  phone: string;
  tagline: string;
  position: string;
  bio: string;
  instagram: string;
  image_url: string;
  reset_token?: string;
  reset_token_expires?: Date;
};

export type BrotherOverviewField = {
  id: string;
  first_name: string;
  last_name: string;
  house: string;
  position: string;
  year: number;
  image_url: string;
};

export interface ContactInfo {
  icon: string;
  text: string;
  alt: string;
}

export interface BrotherProfileProps {
  first_name: string;
  last_name: string;
  personal_email: string;
  school_email: string;
  brother_name: string;
  house: string;
  year: number;
  birthday: string;
  location: string;
  phone: string;
  tagline: string;
  position: string;
  bio: string;
  instagram?: string;
  image_url?: string;
}

export type Recruit = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  year: number;
  room: string;
  image_url: string;
};

export type RecruitProfileProps = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  year: number;
  room: string;
  image_url: string;
  comments: RecruitCommentProps[];
};

export type RecruitOverviewField = {
  id: string;
  first_name: string;
  last_name: string;
  room: string;
  year: number;
  image_url: string;
};

export type RecruitComment = {
  id: string;
  recruit_id: string;
  brother_id: string;
  comment: string;
  red_flag: string;
};

export type RecruitCommentProps = {
  recruit_id: string;
  brother_id: string;
  comment: string;
  red_flag: string;
};

export interface PillarProps {
  title: string;
  description: string;
  backgroundImage: string;
}

export interface MenuButtonProps {
  text: string;
  icon: string;
  onClick?: () => void;
}

export interface ActionButtonProps {
  text: string;
  icon: string;
  onClick?: () => void;
}

export interface FooterProps {
  year: number;
  logo: string;
  icon: string;
}

export interface HeaderProps {
  logo: string;
  menuIcon: string;
}

export interface HeroProps {
  backgroundImage: string;
}

export interface MissionProps {
  text: string;
}

export interface BrotherCardProps {
  id: string;
  first_name: string;
  last_name: string;
  house: string;
  position: string;
  image_url: string;
}

export interface RecruitCardProps {
  id: string;
  first_name: string;
  last_name: string;
  room: string;
  image_url: string;
}

export interface BrotherYearSectionProps {
  year: string;
  brothers: BrotherCardProps[];
}

export interface RecruitYearSectionProps {
  year: string;
  recruits: RecruitCardProps[];
}

export interface BackToButtonProps {
  text: string;
  type: string;
  subText: string;
  icon: string;
}

export interface MenuButtonProps {
  text: string;
  icon: string;
  isLoggedIn: boolean;
}

export interface MenuWrapperProps {
  text: string;
  icon: string;
}

export interface BrotherUser {
  id: string;
  personal_email: string;
  password: string;
  // any other fields from your DB
}