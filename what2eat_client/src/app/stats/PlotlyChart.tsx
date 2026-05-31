'use client';

import React, { useEffect, useRef } from 'react';
import type { Data, Layout, Config } from 'plotly.js';

type PlotlyModule = typeof import('plotly.js-dist-min');

export interface PlotPoint {
    customdata?: unknown;
    x?: unknown;
    y?: unknown;
    data?: { name?: string };
}

interface PlotlyChartProps {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    onPointClick?: (point: PlotPoint) => void;
    className?: string;
    style?: React.CSSProperties;
}

const PlotlyChart = (props: PlotlyChartProps) => {
    const { data, layout, config, onPointClick, className, style } =
        props;
    const containerRef = useRef<HTMLDivElement>(null);
    const plotlyRef = useRef<PlotlyModule | null>(null);
    const clickRef = useRef<typeof onPointClick>(onPointClick);
    clickRef.current = onPointClick;

    useEffect(() => {
        let cancelled = false;
        const render = async () => {
            const Plotly =
                plotlyRef.current ??
                (await import('plotly.js-dist-min')).default;
            if (cancelled || !containerRef.current) return;
            plotlyRef.current = Plotly as unknown as PlotlyModule;

            await Plotly.react(
                containerRef.current,
                data,
                {
                    autosize: true,
                    margin: { t: 40, r: 20, b: 50, l: 60 },
                    ...layout,
                },
                {
                    responsive: true,
                    displaylogo: false,
                    ...config,
                },
            );

            const el = containerRef.current as unknown as {
                removeAllListeners?: (e: string) => void;
                on: (e: string, cb: (ev: any) => void) => void;
            };
            el.removeAllListeners?.('plotly_click');
            el.on('plotly_click', (ev: { points?: PlotPoint[] }) => {
                const pt = ev.points?.[0];
                if (pt && clickRef.current) clickRef.current(pt);
            });
        };
        render();
        return () => {
            cancelled = true;
        };
    }, [data, layout, config]);

    useEffect(() => {
        const node = containerRef.current;
        return () => {
            if (node && plotlyRef.current) {
                plotlyRef.current.purge(node);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: '100%', height: '60vh', ...style }}
        />
    );
};

export default PlotlyChart;
