'use client';

import * as React from 'react';

import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	Link,
	Button,
	NavbarMenuToggle,
	NavbarMenu,
	NavbarMenuItem,
	useDisclosure,
} from '@heroui/react';

import { usePathname } from 'next/navigation';

import NextLink from 'next/link';

import { useAuth } from './auth/AuthContext';
import LoginModal from './auth/LoginModal';
import SignUpModal from './auth/SignUpModal';

const pages: string[] = [
	'Home',
	'Reviews',
	'Stats',
	'Dining',
	'Edits',
];

const ref: string[] = [
	'/',
	'/reviews',
	'/stats',
	'/dining',
	'/edits',
];

function NavigationBar() {
	const [isMenuOpen] = React.useState(false);

	const { user, isAuthenticated, loading, logout } =
		useAuth();
	const { isOpen, onOpen, onOpenChange } =
		useDisclosure();
	const {
		isOpen: isSignUpOpen,
		onOpen: onSignUpOpen,
		onOpenChange: onSignUpOpenChange,
	} = useDisclosure();

	const pageIdx = ref.indexOf(usePathname());
	return (
		<Navbar className='w-full flex flex-row items-center h-[10vh]'>
			<NavbarContent>
				<NavbarMenuToggle
					aria-label={
						isMenuOpen
							? 'Close menu'
							: 'Open menu'
					}
					className='sm:hidden'
				/>
				<NavbarBrand>
					<p className='font-bold text-2xl'>
						<NextLink href='/'>W2E</NextLink>
					</p>
				</NavbarBrand>
			</NavbarContent>
			<NavbarContent className='hidden sm:flex gap-4 min-w-1/2'>
				{pages.map((page, index) => (
					<NavbarItem
						isActive={pageIdx == index}
						key={page}
						className='text-xl'
					>
						<NextLink
							href={ref[index]}
							className={
								pageIdx == index
									? 'text-primary'
									: ''
							}
						>
							{page}
						</NextLink>
					</NavbarItem>
				))}
			</NavbarContent>
			<NavbarMenu>
				{pages.map((page, index) => (
					<NavbarMenuItem
						key={`${page}-${index}`}
						className='w-full'
					>
						<NextLink
							href={ref[index]}
							className={
								pageIdx == index
									? 'text-primary'
									: ''
							}
						>
							{page}
						</NextLink>
					</NavbarMenuItem>
				))}
			</NavbarMenu>
			<NavbarContent justify='end'>
				{loading ? null : isAuthenticated ? (
					<>
						<NavbarItem className='hidden sm:flex'>
							<span className='text-default-600'>
								{user?.username}
							</span>
						</NavbarItem>
						<NavbarItem>
							<Button
								color='danger'
								variant='flat'
								onPress={logout}
							>
								Logout
							</Button>
						</NavbarItem>
					</>
				) : (
					<>
						<NavbarItem className='lg:flex'>
							<Link
								className='cursor-pointer'
								onPress={onOpen}
							>
								Login
							</Link>
						</NavbarItem>
						<NavbarItem>
							<Button
								color='primary'
								variant='flat'
								onPress={onSignUpOpen}
							>
								Sign Up
							</Button>
						</NavbarItem>
					</>
				)}
			</NavbarContent>
			<LoginModal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
			/>
			<SignUpModal
				isOpen={isSignUpOpen}
				onOpenChange={onSignUpOpenChange}
			/>
		</Navbar>
	);
}

export default NavigationBar;
