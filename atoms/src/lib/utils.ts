import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type WithClassName<T = unknown> = T & {
  className?: string;
};

export type WithChildren<T = unknown> = T & {
  children?: React.ReactNode;
};

export type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};
