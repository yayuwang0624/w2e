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
} from "@heroui/react";

import { usePathname } from 'next/navigation';

import NextLink from 'next/link';

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
                <NavbarItem className='lg:flex'>
                    <Link href='#'>Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button
                        as={Link}
                        color='primary'
                        href='#'
                        variant='flat'
                    >
                        Sign Up
                    </Button>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}

export default NavigationBar;
