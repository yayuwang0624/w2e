'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Data, Layout } from 'plotly.js';

import {
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from '@heroui/react';

import PlotlyChart, { PlotPoint } from './PlotlyChart';
import {
    iReview,
    restaurantMeans,
    reviewerSummary,
    reviewerColor,
    reviewersByCount,
} from './statsData';

const ReviewerStats = (props: {
    reviews: iReview[];
    selectedReviewers: string[];
    suffix?: string;
}) => {
    const { reviews, selectedReviewers, suffix = '' } = props;
    const router = useRouter();

    const allReviewers = useMemo(
        () => reviewersByCount(reviews).map((r) => r.reviewer),
        [reviews],
    );

    const reviewers = useMemo(
        () =>
            allReviewers.filter((r) =>
                selectedReviewers.includes(r),
            ),
        [allReviewers, selectedReviewers],
    );

    const means = useMemo(
        () => restaurantMeans(reviews),
        [reviews],
    );
    const summary = useMemo(
        () =>
            reviewerSummary(reviews, means)
                .filter((s) => selectedReviewers.includes(s.reviewer))
                .sort((a, b) => b.count - a.count),
        [reviews, means, selectedReviewers],
    );

    const jumpTo = (point: PlotPoint) => {
        const uuid = point.customdata as string | undefined;
        if (uuid) router.push(`/reviews?focus=${uuid}`);
    };

    // Axis bounds from the full dataset so they don't shift with selection.
    const bounds = useMemo(() => {
        const scores = reviews.map((r) => r.score);
        return {
            lo: Math.min(...scores, ...means.values()) - 3,
            hi: Math.max(...scores, ...means.values()) + 3,
        };
    }, [reviews, means]);

    const scatterData = useMemo(() => {
        const { lo, hi } = bounds;

        const traces: Data[] = reviewers.map((reviewer) => {
            const rs = reviews.filter(
                (r) => r.reviewer === reviewer,
            );
            return {
                type: 'scatter',
                mode: 'markers',
                name: reviewer,
                x: rs.map((r) => means.get(r.restaurant) ?? null),
                y: rs.map((r) => r.score),
                customdata: rs.map((r) => r.uuid),
                text: rs.map((r) => r.restaurant),
                marker: {
                    size: 9,
                    opacity: 0.75,
                    color: reviewerColor(reviewer, allReviewers),
                },
                hovertemplate:
                    `<b>${reviewer}</b><br>` +
                    '%{text}<br>' +
                    'score: %{y}<br>' +
                    'restaurant avg: %{x:.1f}<extra></extra>',
            } as Data;
        });

        traces.push({
            type: 'scatter',
            mode: 'lines',
            name: 'unbiased (y = x)',
            x: [lo, hi],
            y: [lo, hi],
            line: { dash: 'dash', color: '#999', width: 1 },
            hoverinfo: 'skip',
            showlegend: true,
        } as Data);

        return traces;
    }, [reviewers, allReviewers, means, bounds]);

    const scatterLayout: Partial<Layout> = useMemo(
        () => ({
            title: {
                text:
                    'Reviewer score vs restaurant average' + suffix,
            },
            xaxis: {
                title: { text: 'Restaurant average score' + suffix },
                range: [bounds.lo, bounds.hi],
            },
            yaxis: {
                title: { text: 'This reviewer’s score' + suffix },
                range: [bounds.lo, bounds.hi],
            },
            hovermode: 'closest',
            legend: { orientation: 'h', y: -0.2 },
        }),
        [suffix, bounds],
    );

    // Manual binning so each bar can carry both percent (height) and the
    // raw count (hover label / customdata).
    const histData = useMemo(() => {
        const start = 0;
        const end = 100;
        const size = 2;
        const nbins = (end - start) / size;
        const centers = Array.from(
            { length: nbins },
            (_, i) => start + (i + 0.5) * size,
        );

        return reviewers.map((reviewer) => {
            const scores = reviews
                .filter((r) => r.reviewer === reviewer)
                .map((r) => r.score);
            const total = scores.length;
            const counts = new Array(nbins).fill(0);
            for (const s of scores) {
                let idx = Math.floor((s - start) / size);
                if (idx < 0) idx = 0;
                if (idx >= nbins) idx = nbins - 1;
                counts[idx] += 1;
            }
            return {
                type: 'bar',
                name: reviewer,
                x: centers,
                y: counts.map((c) =>
                    total ? (c / total) * 100 : 0,
                ),
                customdata: counts,
                width: size * 0.85,
                opacity: 0.6,
                marker: {
                    color: reviewerColor(reviewer, allReviewers),
                },
                hovertemplate:
                    `<b>${reviewer}</b><br>` +
                    'score ~%{x}<br>' +
                    '%{y:.1f}% (%{customdata} reviews)<extra></extra>',
            } as Data;
        });
    }, [reviews, reviewers, allReviewers]);

    const histLayout: Partial<Layout> = useMemo(
        () => ({
            title: {
                text: 'Score distribution by reviewer' + suffix,
            },
            barmode: 'overlay',
            xaxis: {
                title: { text: 'Score' + suffix },
                range: [0, 100],
            },
            yaxis: { title: { text: 'Percent (%)' } },
            legend: { orientation: 'h', y: -0.2 },
        }),
        [suffix],
    );

    if (reviewers.length === 0) {
        return (
            <div className='w-full text-center text-default-500 mt-[10vh]'>
                Select one or more reviewers above to see their
                scoring.
            </div>
        );
    }

    return (
        <div className='w-full flex flex-col space-y-[4vh]'>
            <PlotlyChart
                data={scatterData}
                layout={scatterLayout}
                onPointClick={jumpTo}
            />

            <PlotlyChart data={histData} layout={histLayout} />

            <Table aria-label='Reviewer summary table'>
                <TableHeader>
                    <TableColumn key='reviewer'>
                        Reviewer
                    </TableColumn>
                    <TableColumn key='count'>Reviews</TableColumn>
                    <TableColumn key='mean'>Mean</TableColumn>
                    <TableColumn key='std'>Std</TableColumn>
                    <TableColumn key='bias'>
                        Bias (vs crowd)
                    </TableColumn>
                </TableHeader>
                <TableBody items={summary}>
                    {(row) => (
                        <TableRow key={row.reviewer}>
                            <TableCell>{row.reviewer}</TableCell>
                            <TableCell>{row.count}</TableCell>
                            <TableCell>
                                {row.mean.toFixed(1)}
                            </TableCell>
                            <TableCell>
                                {row.std.toFixed(1)}
                            </TableCell>
                            <TableCell>
                                {row.bias > 0 ? '+' : ''}
                                {row.bias.toFixed(1)}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ReviewerStats;
