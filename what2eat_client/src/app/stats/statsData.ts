import { JRPCBody, JRPCRequest } from '@/app/RPC/JRPCRequest';

export interface iReview {
    uuid: string;
    dining: string;
    reviewer: string;
    restaurant: string;
    score: number;
    comment: string | null;
    unixTimestamp: number | null;
}

export interface iDishReview {
    uuid: string;
    review_id: string;
    dish: string;
    score: number;
    comment: string | null;
}

export interface iDishReviewFull extends iDishReview {
    reviewer: string;
    restaurant: string;
}

export interface iReviewerSummary {
    reviewer: string;
    count: number;
    mean: number;
    std: number;
    bias: number;
}

export const fetchReviews = async (): Promise<iReview[]> => {
    try {
        const response = await JRPCRequest(JRPCBody('get_reviews'));
        return JSON.parse(response.result) as iReview[];
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const fetchDishReviews = async (
    reviews: iReview[],
): Promise<iDishReviewFull[]> => {
    try {
        const response = await JRPCRequest(
            JRPCBody('get_dish_reviews'),
        );
        const dishReviews = JSON.parse(
            response.result,
        ) as iDishReview[];

        const byReviewId = new Map<string, iReview>();
        for (const review of reviews) {
            byReviewId.set(review.uuid, review);
        }

        return dishReviews.map((dr) => {
            const parent = byReviewId.get(dr.review_id);
            return {
                ...dr,
                reviewer: parent?.reviewer ?? '(unknown)',
                restaurant: parent?.restaurant ?? '(unknown)',
            };
        });
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const normalizeReviews = (
    reviews: iReview[],
): iReview[] => {
    const range = new Map<string, { min: number; max: number }>();
    for (const r of reviews) {
        const cur = range.get(r.reviewer);
        if (!cur) {
            range.set(r.reviewer, { min: r.score, max: r.score });
        } else {
            cur.min = Math.min(cur.min, r.score);
            cur.max = Math.max(cur.max, r.score);
        }
    }
    return reviews.map((r) => {
        const { min, max } = range.get(r.reviewer)!;
        const score =
            max > min ? ((r.score - min) / (max - min)) * 100 : 50;
        return { ...r, score };
    });
};

export const rankNormalizeReviews = (
    reviews: iReview[],
): iReview[] => {
    const byReviewer = new Map<string, number[]>();
    for (const r of reviews) {
        if (!byReviewer.has(r.reviewer)) {
            byReviewer.set(r.reviewer, []);
        }
        byReviewer.get(r.reviewer)!.push(r.score);
    }

    const pctByReviewer = new Map<string, Map<number, number>>();
    for (const [reviewer, scores] of byReviewer) {
        const sorted = [...scores].sort((a, b) => a - b);
        const n = sorted.length;
        const pct = new Map<number, number>();
        for (const value of new Set(sorted)) {
            const first = sorted.indexOf(value);
            const last = sorted.lastIndexOf(value);
            const avgRank = (first + last) / 2;
            pct.set(value, n > 1 ? (avgRank / (n - 1)) * 100 : 50);
        }
        pctByReviewer.set(reviewer, pct);
    }

    return reviews.map((r) => ({
        ...r,
        score: pctByReviewer.get(r.reviewer)!.get(r.score)!,
    }));
};

export const mean = (values: number[]): number =>
    values.length === 0
        ? 0
        : values.reduce((a, b) => a + b, 0) / values.length;

export const std = (values: number[]): number => {
    if (values.length === 0) return 0;
    const m = mean(values);
    return Math.sqrt(
        mean(values.map((v) => (v - m) * (v - m))),
    );
};

export const restaurantMeans = (
    reviews: iReview[],
): Map<string, number> => {
    const grouped = new Map<string, number[]>();
    for (const r of reviews) {
        if (!grouped.has(r.restaurant)) {
            grouped.set(r.restaurant, []);
        }
        grouped.get(r.restaurant)!.push(r.score);
    }
    const means = new Map<string, number>();
    for (const [restaurant, scores] of grouped) {
        means.set(restaurant, mean(scores));
    }
    return means;
};

export const reviewerSummary = (
    reviews: iReview[],
    means: Map<string, number>,
): iReviewerSummary[] => {
    const grouped = new Map<string, iReview[]>();
    for (const r of reviews) {
        if (!grouped.has(r.reviewer)) {
            grouped.set(r.reviewer, []);
        }
        grouped.get(r.reviewer)!.push(r);
    }

    const summaries: iReviewerSummary[] = [];
    for (const [reviewer, rs] of grouped) {
        const scores = rs.map((r) => r.score);
        const biases = rs.map(
            (r) => r.score - (means.get(r.restaurant) ?? r.score),
        );
        summaries.push({
            reviewer,
            count: rs.length,
            mean: mean(scores),
            std: std(scores),
            bias: mean(biases),
        });
    }
    summaries.sort((a, b) => b.bias - a.bias);
    return summaries;
};

export const reviewerColor = (
    reviewer: string,
    reviewers: string[],
): string => {
    const palette = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
        '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
        '#bcbd22', '#17becf', '#393b79', '#637939',
        '#8c6d31', '#843c39', '#7b4173', '#5254a3',
    ];
    const idx = reviewers.indexOf(reviewer);
    return palette[((idx % palette.length) + palette.length) % palette.length];
};

export interface iRestaurantSummary {
    restaurant: string;
    count: number;
    mean: number;
}

export const restaurantSummary = (
    reviews: iReview[],
): iRestaurantSummary[] => {
    const grouped = new Map<
        string,
        { scores: number[]; dinings: Set<string> }
    >();
    for (const r of reviews) {
        if (!grouped.has(r.restaurant)) {
            grouped.set(r.restaurant, {
                scores: [],
                dinings: new Set(),
            });
        }
        const g = grouped.get(r.restaurant)!;
        g.scores.push(r.score);
        g.dinings.add(r.dining);
    }
    return Array.from(grouped.entries())
        .map(([restaurant, { scores, dinings }]) => ({
            restaurant,
            // visits = distinct dinings, not number of reviews
            count: dinings.size,
            mean: mean(scores),
        }))
        .sort(
            (a, b) =>
                b.mean - a.mean ||
                b.count - a.count ||
                a.restaurant.localeCompare(b.restaurant),
        );
};

export const uniqueSorted = (values: string[]): string[] =>
    Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b),
    );

export const reviewersByCount = (
    reviews: iReview[],
): { reviewer: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const r of reviews) {
        counts.set(r.reviewer, (counts.get(r.reviewer) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([reviewer, count]) => ({ reviewer, count }))
        .sort(
            (a, b) =>
                b.count - a.count ||
                a.reviewer.localeCompare(b.reviewer),
        );
};
