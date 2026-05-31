'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Data, Layout } from 'plotly.js';

import { Autocomplete, AutocompleteItem } from '@heroui/react';

import PlotlyChart, { PlotPoint } from './PlotlyChart';
import {
    iReview,
    iRestaurantSummary,
    mean,
    restaurantSummary,
    reviewerColor,
    reviewersByCount,
    uniqueSorted,
} from './statsData';

const TIERS: {
    label: string;
    color: string;
    test: (m: number) => boolean;
}[] = [
    { label: '90+', color: '#2ca02c', test: (m) => m >= 90 },
    {
        label: '75–90',
        color: '#bcbd22',
        test: (m) => m >= 75 && m < 90,
    },
    {
        label: '60–75',
        color: '#ff7f0e',
        test: (m) => m >= 60 && m < 75,
    },
    { label: '<60', color: '#d62728', test: (m) => m < 60 },
];

const RestaurantStats = (props: {
    reviews: iReview[];
    selectedReviewers: string[];
}) => {
    const { reviews, selectedReviewers } = props;
    const router = useRouter();

    const restaurants = useMemo(
        () => uniqueSorted(reviews.map((r) => r.restaurant)),
        [reviews],
    );
    const leaderboard = useMemo(
        () => restaurantSummary(reviews),
        [reviews],
    );
    const allReviewers = useMemo(
        () => reviewersByCount(reviews).map((r) => r.reviewer),
        [reviews],
    );
    const [selected, setSelected] = useState<string | null>(
        null,
    );

    const rows = useMemo(() => {
        if (!selected) return [];
        const forRestaurant = reviews.filter(
            (r) => r.restaurant === selected,
        );
        return selectedReviewers.length === 0
            ? forRestaurant
            : forRestaurant.filter((r) =>
                  selectedReviewers.includes(r.reviewer),
              );
    }, [reviews, selected, selectedReviewers]);

    const avg = useMemo(
        () => mean(rows.map((r) => r.score)),
        [rows],
    );

    const jumpTo = (point: PlotPoint) => {
        const uuid = point.customdata as string | undefined;
        if (uuid) router.push(`/reviews?focus=${uuid}`);
    };

    const overviewData = useMemo<Data[]>(
        () =>
            TIERS.map((tier) => {
                const items = leaderboard.filter(
                    (r: iRestaurantSummary) => tier.test(r.mean),
                );
                return {
                    type: 'scatter',
                    mode: 'markers',
                    name: tier.label,
                    x: items.map((r) => r.mean),
                    y: items.map((r) => r.count),
                    customdata: items.map((r) => r.restaurant),
                    text: items.map((r) => r.restaurant),
                    marker: {
                        size: 14,
                        opacity: 0.85,
                        color: tier.color,
                        line: { width: 1, color: '#888' },
                    },
                    hovertemplate:
                        '<b>%{customdata}</b><br>' +
                        'avg score: %{x:.1f}<br>' +
                        'visits: %{y}<br>' +
                        '(click to inspect)<extra></extra>',
                } as Data;
            }),
        [leaderboard],
    );

    const overviewLayout = useMemo<Partial<Layout>>(
        () => ({
            title: {
                text: 'Restaurants — average score vs visits',
            },
            xaxis: {
                title: { text: 'Average score' },
                range: [0, 100],
            },
            yaxis: {
                title: { text: 'Visits' },
                rangemode: 'tozero',
            },
            hovermode: 'closest',
            legend: { title: { text: 'Avg score' } },
        }),
        [],
    );

    const pickRestaurant = (point: PlotPoint) => {
        const name = point.customdata as string | undefined;
        if (name) setSelected(name);
    };

    const data = useMemo<Data[]>(() => {
        if (rows.length === 0) return [];
        const reviewers = uniqueSorted(
            rows.map((r) => r.reviewer),
        );
        return reviewers.map((reviewer) => {
            const rs = rows.filter(
                (r) => r.reviewer === reviewer,
            );
            return {
                type: 'scatter',
                mode: 'markers',
                name: reviewer,
                x: rs.map((r) => r.score),
                y: rs.map((r) => r.reviewer),
                customdata: rs.map((r) => r.uuid),
                marker: {
                    size: 14,
                    opacity: 0.85,
                    color: reviewerColor(reviewer, allReviewers),
                    line: { width: 1, color: '#888' },
                },
                hovertemplate:
                    '%{y}: %{x}<br>(click to open review)<extra></extra>',
            } as Data;
        });
    }, [rows, allReviewers]);

    const layout = useMemo<Partial<Layout>>(
        () => ({
            title: {
                text: selected
                    ? `${selected} — scores by reviewer (avg ${avg.toFixed(1)})`
                    : 'Pick a restaurant',
            },
            xaxis: { title: { text: 'Score' }, range: [0, 100] },
            yaxis: { title: { text: 'Reviewer' }, automargin: true },
            hovermode: 'closest',
            showlegend: false,
            shapes: selected
                ? [
                      {
                          type: 'line',
                          x0: avg,
                          x1: avg,
                          yref: 'paper',
                          y0: 0,
                          y1: 1,
                          line: {
                              dash: 'dash',
                              color: '#d62728',
                              width: 1,
                          },
                      },
                  ]
                : [],
        }),
        [selected, avg],
    );

    return (
        <div className='w-full flex flex-col space-y-[3vh]'>
            <PlotlyChart
                data={overviewData}
                layout={overviewLayout}
                onPointClick={pickRestaurant}
            />

            <Autocomplete
                label='Restaurant'
                placeholder='Search a restaurant'
                defaultItems={restaurants.map((r) => ({ key: r }))}
                selectedKey={selected}
                onSelectionChange={(key) =>
                    setSelected(key ? String(key) : null)
                }
            >
                {(item: { key: string }) => (
                    <AutocompleteItem key={item.key}>
                        {item.key}
                    </AutocompleteItem>
                )}
            </Autocomplete>

            {selected && (
                <PlotlyChart
                    data={data}
                    layout={layout}
                    onPointClick={jumpTo}
                />
            )}
        </div>
    );
};

export default RestaurantStats;
