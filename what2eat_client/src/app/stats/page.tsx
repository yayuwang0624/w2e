'use client';

import React, {
    Suspense,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Chip, Spinner, Tab, Tabs } from '@heroui/react';

import NavigationBar from '@/app/NavigationBar';
import ReviewerStats from './ReviewerStats';
import RestaurantStats from './RestaurantStats';
import {
    fetchReviews,
    normalizeReviews,
    rankNormalizeReviews,
    reviewersByCount,
    iReview,
} from './statsData';

type NormMode = 'raw' | 'minmax' | 'rank';

const NORM_ORDER: NormMode[] = ['raw', 'minmax', 'rank'];

const NORM_LABEL: Record<NormMode, string> = {
    raw: 'Raw scores',
    minmax: 'Normalized (min–max)',
    rank: 'Ranked (even spread)',
};

const NORM_SUFFIX: Record<NormMode, string> = {
    raw: '',
    minmax: ' (normalized)',
    rank: ' (ranked)',
};

const StatsContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [reviews, setReviews] = useState<iReview[]>([]);
    const [loading, setLoading] = useState(true);

    const [selected, setSelected] = useState<Set<string>>(() => {
        const raw = searchParams.get('reviewers');
        return new Set(
            raw ? raw.split(',').filter(Boolean) : [],
        );
    });

    const [tab, setTab] = useState<string>(
        () => searchParams.get('tab') ?? 'reviewers',
    );

    const [mode, setMode] = useState<NormMode>(() => {
        const m = searchParams.get('norm');
        return m === 'minmax' || m === 'rank' ? m : 'raw';
    });

    useEffect(() => {
        const load = async () => {
            const rv = await fetchReviews();
            setReviews(rv);
            setLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(
            Array.from(searchParams.entries()),
        );
        const value = Array.from(selected).join(',');
        if (value) params.set('reviewers', value);
        else params.delete('reviewers');
        if (tab && tab !== 'reviewers') params.set('tab', tab);
        else params.delete('tab');
        if (mode !== 'raw') params.set('norm', mode);
        else params.delete('norm');
        const qs = params.toString();
        router.replace(qs ? `/stats?${qs}` : '/stats', {
            scroll: false,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, tab, mode]);

    const ranked = useMemo(
        () => reviewersByCount(reviews),
        [reviews],
    );

    const selectedReviewers = useMemo(
        () => Array.from(selected),
        [selected],
    );

    const displayReviews = useMemo(() => {
        if (mode === 'minmax') return normalizeReviews(reviews);
        if (mode === 'rank') return rankNormalizeReviews(reviews);
        return reviews;
    }, [mode, reviews]);

    const suffix = NORM_SUFFIX[mode];

    const cycleMode = () =>
        setMode(
            (m) =>
                NORM_ORDER[
                    (NORM_ORDER.indexOf(m) + 1) % NORM_ORDER.length
                ],
        );

    const toggle = (reviewer: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(reviewer)) next.delete(reviewer);
            else next.add(reviewer);
            return next;
        });
    };

    return (
        <div className='flex flex-col items-center m-1 min-h-[90vh] min-w-[60%] lg:max-w-[60%] mx-auto p-1'>
            {loading ? (
                <Spinner
                    className='mt-[20vh]'
                    label='Loading stats…'
                />
            ) : (
                <div className='w-full flex flex-col space-y-[2vh]'>
                    <div className='flex flex-col gap-2 w-full'>
                        <div className='flex flex-row items-center gap-2'>
                            <span className='text-sm text-default-500'>
                                Reviewers (shared across tabs):
                            </span>
                            <Button
                                size='sm'
                                variant='flat'
                                onPress={() =>
                                    setSelected(
                                        new Set(
                                            ranked.map(
                                                (r) => r.reviewer,
                                            ),
                                        ),
                                    )
                                }
                            >
                                All
                            </Button>
                            <Button
                                size='sm'
                                variant='flat'
                                onPress={() =>
                                    setSelected(new Set())
                                }
                            >
                                Clear
                            </Button>
                            <Button
                                size='sm'
                                variant={
                                    mode === 'raw'
                                        ? 'bordered'
                                        : 'solid'
                                }
                                color={
                                    mode === 'raw'
                                        ? 'default'
                                        : 'primary'
                                }
                                className='ml-auto'
                                onPress={cycleMode}
                            >
                                {NORM_LABEL[mode]}
                            </Button>
                        </div>
                        <div className='flex flex-row flex-wrap gap-2'>
                            {ranked.map(({ reviewer, count }) => {
                                const on = selected.has(reviewer);
                                return (
                                    <Chip
                                        key={reviewer}
                                        variant={
                                            on
                                                ? 'solid'
                                                : 'bordered'
                                        }
                                        color={
                                            on
                                                ? 'primary'
                                                : 'default'
                                        }
                                        className='cursor-pointer'
                                        onClick={() =>
                                            toggle(reviewer)
                                        }
                                    >
                                        {reviewer} ({count})
                                    </Chip>
                                );
                            })}
                        </div>
                    </div>

                    <Tabs
                        aria-label='Stats views'
                        className='w-full'
                        classNames={{ panel: 'w-full' }}
                        selectedKey={tab}
                        onSelectionChange={(key) =>
                            setTab(String(key))
                        }
                    >
                        <Tab key='reviewers' title='Reviewers'>
                            <ReviewerStats
                                reviews={displayReviews}
                                selectedReviewers={
                                    selectedReviewers
                                }
                                suffix={suffix}
                            />
                        </Tab>
                        <Tab key='restaurants' title='Restaurants'>
                            <RestaurantStats
                                reviews={displayReviews}
                                selectedReviewers={
                                    selectedReviewers
                                }
                                suffix={suffix}
                            />
                        </Tab>
                    </Tabs>
                </div>
            )}
        </div>
    );
};

const Page = () => {
    return (
        <>
            <NavigationBar />
            <Suspense fallback={null}>
                <StatsContent />
            </Suspense>
        </>
    );
};

export default Page;
