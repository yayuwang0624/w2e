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
    suffix?: string;
}) => {
    const { reviews, selectedReviewers, suffix = '' } = props;
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

    const overviewData = useMemo<Data[]>(() => {
        const sel = selected
            ? leaderboard.find(
                  (r: iRestaurantSummary) =>
                      r.restaurant === selected,
              )
            : undefined;

        const tierTraces = TIERS.map((tier) => {
            // The selected node is excluded here and redrawn once as the
            // emphasised overlay below, so it isn't rendered twice.
            const items = leaderboard.filter(
                (r: iRestaurantSummary) =>
                    tier.test(r.mean) && r.restaurant !== selected,
            );
            // Fade the remaining nodes when something is selected, and make
            // them non-hoverable so they can't steal hover from the selected
            // overlay when their coordinates overlap.
            const opacity = sel ? 0.08 : 0.85;
            return {
                type: 'scatter',
                mode: 'markers',
                name: tier.label,
                x: items.map((r) => r.mean),
                y: items.map((r) => r.count),
                customdata: items.map((r) => r.restaurant),
                text: items.map((r) => r.restaurant),
                // hoverinfo 'skip' is ignored while a hovertemplate is set, so
                // the template must be dropped to truly disable these nodes.
                hoverinfo: sel ? 'skip' : undefined,
                marker: {
                    size: 14,
                    opacity,
                    color: tier.color,
                    line: { width: 1, color: '#888' },
                },
                hovertemplate: sel
                    ? undefined
                    : '<b>%{customdata}</b><br>' +
                      'avg score: %{x:.1f}<br>' +
                      'visits: %{y}<br>' +
                      '(click to inspect)<extra></extra>',
            } as Data;
        });

        // Redraw the selected node on top, enlarged with a bold outline,
        // so overlapping neighbours can't be mistaken for it.
        if (sel) {
            const selColor =
                TIERS.find((t) => t.test(sel.mean))?.color ?? '#111';
            tierTraces.push({
                type: 'scatter',
                mode: 'markers',
                name: 'selected',
                x: [sel.mean],
                y: [sel.count],
                customdata: [sel.restaurant],
                text: [sel.restaurant],
                showlegend: false,
                marker: {
                    size: 22,
                    color: selColor,
                    opacity: 1,
                    line: { width: 3, color: '#111' },
                },
                hovertemplate:
                    '<b>%{customdata}</b><br>' +
                    'avg score: %{x:.1f}<br>' +
                    'visits: %{y}<extra></extra>',
            } as Data);
        }
        return tierTraces;
    }, [leaderboard, selected]);

    const overviewLayout = useMemo<Partial<Layout>>(
        () => ({
            title: {
                text:
                    'Restaurants — average score vs visits' + suffix,
            },
            // Autorange (the double-click view) fits the data with padding
            // instead of pinning points to a hardcoded 0–100 / tozero edge.
            xaxis: {
                title: { text: 'Average score' + suffix },
                autorange: true,
            },
            yaxis: {
                title: { text: 'Visits' },
                autorange: true,
            },
            hovermode: 'closest',
            legend: { title: { text: 'Avg score' } },
        }),
        [suffix],
    );

    // With nothing selected, clicking a node selects it. Once something is
    // selected, any click (node or empty space) clears the selection -- see
    // the wrapper onClick below for the empty-space case.
    const pickRestaurant = (point: PlotPoint) => {
        if (selected) {
            setSelected(null);
            return;
        }
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
            xaxis: {
                title: { text: 'Score' + suffix },
                range: [0, 100],
            },
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
        [selected, avg, suffix],
    );

    return (
        <div className='w-full flex flex-col space-y-[3vh]'>
            {/* While a restaurant is selected, a click anywhere in the chart
                (including empty space, which Plotly doesn't emit as a point
                click) exits the selection. */}
            <div
                onClick={() => {
                    if (selected) setSelected(null);
                }}
            >
                <PlotlyChart
                    data={overviewData}
                    layout={overviewLayout}
                    onPointClick={pickRestaurant}
                />
            </div>

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
