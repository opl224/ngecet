
import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>SimplicChat Logo</title>
      <path d="M17 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6l-2 2v2h6l2-2V9Z" />
      <path d="M7 17h10a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2H7Z" />
    </svg>
  );
}
