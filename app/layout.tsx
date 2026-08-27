import './globals.css';
import type { ReactNode } from 'react';
export const metadata = { title: 'YUGAM SMP | Player Passport', description: 'Official YUGAM SMP player identity platform' };
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
