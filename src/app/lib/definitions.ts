// This file contains type definitions for our data
import type { StaticImageData } from "next/image";

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
  backgroundImage: StaticImageData;
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
  backgroundImage: StaticImageData;
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
  priority?: boolean; // For prioritizing above-fold images
}

export interface RecruitCardProps {
  id: string;
  first_name: string;
  last_name: string;
  room: string;
  image_url: string;
  priority?: boolean; // For prioritizing above-fold images
}

export interface BrotherYearSectionProps {
  year: string;
  brothers: BrotherCardProps[];
  // How many of this section's cards are still within the page-wide preload
  // budget. Counted across sections so we don't preload a row per year.
  priorityCount?: number;
}

export interface RecruitYearSectionProps {
  year: string;
  recruits: RecruitCardProps[];
  // How many of this section's cards are still within the page-wide preload
  // budget. Counted across sections so we don't preload a row per year.
  priorityCount?: number;
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
  /** Shows the dashboard link only to brothers who can actually open it. */
  isBoardMember: boolean;
  /** Hides the recruits link while the board has that section closed. */
  canSeeRecruits: boolean;
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

/** One profile in the management dashboard table, brother or recruit. */
export type DashboardRow = {
  id: string;
  type: DashboardRowType;
  /** Full name, already joined for display and sorting. */
  name: string;
  year: number;
  /** Board position for a brother, room assignment for a recruit. */
  detail: string;
  image_url: string;
  /** The signed-in brother's own row, which can be edited but never deleted. */
  isCurrentUser: boolean;
};

export type DashboardRowType = "brother" | "recruit";

/** Profiles picked for deletion, split by table so each id stays unambiguous. */
export type DashboardSelection = {
  brotherIds: string[];
  recruitIds: string[];
};

/**
 * The outcome of a dashboard mutation.
 *
 * The deleted ids let the table drop the rows it just removed from its
 * selection instead of guessing which of them the server actually deleted.
 */
export type DeleteProfilesResult = {
  status: "success" | "error";
  message: string;
  deletedBrotherIds: string[];
  deletedRecruitIds: string[];
};
