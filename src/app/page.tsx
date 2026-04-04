import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to auth/signup by default
  redirect('/auth/signup');
}
