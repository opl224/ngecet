
// src/config/statusThemes.ts
export type StatusColorThemeName = 
  | 'Mustard' 
  | 'Forest' 
  | 'Sky' 
  | 'Royal' 
  | 'Rose' 
  | 'Slate' 
  | 'Teal';

export interface StatusTheme {
  name: StatusColorThemeName;
  bg: string;
  text: string;
  placeholder: string;
}

export const statusColorThemes: StatusTheme[] = [
  { name: 'Mustard', bg: 'bg-yellow-500', text: 'text-white', placeholder: 'placeholder-yellow-200' },
  { name: 'Forest', bg: 'bg-green-600', text: 'text-white', placeholder: 'placeholder-green-200' },
  { name: 'Sky', bg: 'bg-sky-500', text: 'text-white', placeholder: 'placeholder-sky-200' },
  { name: 'Royal', bg: 'bg-indigo-600', text: 'text-white', placeholder: 'placeholder-indigo-200' },
  { name: 'Rose', bg: 'bg-rose-500', text: 'text-white', placeholder: 'placeholder-rose-200' },
  { name: 'Slate', bg: 'bg-slate-700', text: 'text-white', placeholder: 'placeholder-slate-300' },
  { name: 'Teal', bg: 'bg-teal-500', text: 'text-white', placeholder: 'placeholder-teal-200' },
];


export const getStatusThemeClasses = (themeNameInput: StatusColorThemeName | string | undefined): StatusTheme => {
  const themeName = themeNameInput as StatusColorThemeName; // Cast for find
  const theme = statusColorThemes.find(t => t.name === themeName);
  if (theme) {
    return theme;
  }
  // Return a default theme if not found or input is undefined
  return statusColorThemes[0]; // Default to Mustard
};
