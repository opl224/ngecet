// src/config/statusThemes.ts
export const statusColorThemes = [
  { name: 'Mustard', bg: 'bg-yellow-500', text: 'text-white', placeholder: 'placeholder-yellow-200' },
  { name: 'Forest', bg: 'bg-green-600', text: 'text-white', placeholder: 'placeholder-green-200' },
  { name: 'Sky', bg: 'bg-sky-500', text: 'text-white', placeholder: 'placeholder-sky-200' },
  { name: 'Royal', bg: 'bg-indigo-600', text: 'text-white', placeholder: 'placeholder-indigo-200' },
  { name: 'Rose', bg: 'bg-rose-500', text: 'text-white', placeholder: 'placeholder-rose-200' },
  { name: 'Slate', bg: 'bg-slate-700', text: 'text-white', placeholder: 'placeholder-slate-300' },
  { name: 'Teal', bg: 'bg-teal-500', text: 'text-white', placeholder: 'placeholder-teal-200' },
];

export type StatusColorThemeName = typeof statusColorThemes[number]['name'];

export const getStatusThemeClasses = (themeName: StatusColorThemeName | string | undefined) => {
  const theme = statusColorThemes.find(t => t.name === themeName);
  if (theme) {
    return { bg: theme.bg, text: theme.text, name: theme.name };
  }
  // Return a default theme if not found
  return { bg: statusColorThemes[0].bg, text: statusColorThemes[0].text, name: statusColorThemes[0].name };
};
