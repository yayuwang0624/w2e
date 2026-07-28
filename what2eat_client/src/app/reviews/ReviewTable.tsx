import {
	JRPCBody,
	JRPCRequest,
} from '@/app/RPC/JRPCRequest';

import { Config } from '@/app/config';

import {
	Button,
	Input,
	Pagination,
	SortDescriptor,
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
	Textarea,
} from '@heroui/react';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useSearchParams } from 'next/navigation';
import React, {
	useEffect,
	useMemo,
	useState,
	useRef,
} from 'react';
import { createRoot } from 'react-dom/client';
import { v4 as UUID } from 'uuid';

import {
	faCircleChevronDown,
	faCircleChevronUp,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
	fetchDishReviews,
	normalizeReviews,
	rankNormalizeReviews,
} from '@/app/stats/statsData';

dayjs.extend(utc);
dayjs.extend(timezone);

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

// Lets a single search box scope a term to one field, e.g.
// `reviewer:alice dish:ramen` — unprefixed terms fall back to matching
// everything (reviewer/restaurant/comment/score/date/dish names).
type SearchField = 'reviewer' | 'restaurant' | 'dish';

const SEARCH_FIELD_ALIASES: Record<string, SearchField> = {
	reviewer: 'reviewer',
	reviewers: 'reviewer',
	by: 'reviewer',
	restaurant: 'restaurant',
	restaurants: 'restaurant',
	place: 'restaurant',
	dish: 'dish',
	dishes: 'dish',
	food: 'dish',
};

interface SearchToken {
	field: SearchField | null;
	term: string;
}

const SEARCH_TOKEN_REGEX =
	/([a-zA-Z]+):"([^"]*)"|([a-zA-Z]+):(\S+)|"([^"]*)"|(\S+)/g;

function parseSearchQuery(input: string): SearchToken[] {
	const tokens: SearchToken[] = [];
	let match: RegExpExecArray | null;
	SEARCH_TOKEN_REGEX.lastIndex = 0;
	while (
		(match = SEARCH_TOKEN_REGEX.exec(input)) !== null
	) {
		const [
			,
			quotedField,
			quotedTerm,
			plainField,
			plainTerm,
			quoted,
			word,
		] = match;
		const field = (
			quotedField ?? plainField
		)?.toLowerCase();
		const term = quotedTerm ?? plainTerm;
		if (field && term !== undefined) {
			const resolved = SEARCH_FIELD_ALIASES[field];
			if (resolved) {
				if (term !== '')
					tokens.push({ field: resolved, term });
				continue;
			}
			tokens.push({
				field: null,
				term: `${field}:${term}`,
			});
			continue;
		}
		const generic = quoted ?? word;
		if (generic)
			tokens.push({ field: null, term: generic });
	}
	return tokens;
}

function safeRegex(term: string): RegExp | null {
	try {
		return new RegExp(term, 'i');
	} catch {
		return null;
	}
}

interface IReviewData {
	uuid: string;
	reviewer: string;
	restaurant: string;
	score: number;
	comment: string;
	createdAt: Date;
}

interface iReview {
	dining: string;
	reviewer: string;
	restaurant: string;
	score: number;
	comment: string;
	createdAt: Date;
	unixTimestamp: number;
	uuid: string;
}

interface iDishReview {
	uuid: string;
	review_id: string;
	dish: string;
	comment: string | null;
	score: number;
}

const ReviewDetailTable = (props: {
	review: IReviewData;
	dishReviews: iDishReview[];
}) => {
	const { review, dishReviews } = props;

	return (
		<div className='flex flex-col justify-center'>
			<Table aria-label='Review Comment Table'>
				<TableHeader>
					<TableColumn key='comment'>
						Restaurant Comment
					</TableColumn>
				</TableHeader>
				<TableBody items={[review]}>
					<TableRow key={review.uuid}>
						<TableCell>
							<Textarea
								isReadOnly
								minRows={1}
								defaultValue={
									review.comment
								}
							></Textarea>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>

			<Table aria-label='Review Details Table'>
				<TableHeader>
					<TableColumn key='dish'>
						Dish
					</TableColumn>
					<TableColumn key='score'>
						Score
					</TableColumn>
					<TableColumn key='comment'>
						Comment
					</TableColumn>
				</TableHeader>
				<TableBody items={dishReviews}>
					{(dish) => (
						<TableRow key={dish.uuid}>
							<TableCell>
								{dish.dish}
							</TableCell>
							<TableCell>
								{dish.score}
							</TableCell>
							<TableCell>
								{dish.comment}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

const ToggleSubRowButton = (props: {
	review: IReviewData;
}) => {
	const { review } = props;
	const [isExpanded, setIsExpanded] = useState(false);

	const [dishReviews, setDishReviews] = React.useState<
		iDishReview[]
	>([]);

	const updateDishReviews = async (review_id: string) => {
		const dishesByReviewBody = JRPCBody(
			'get_dishes_by_review',
			{ review_id: review_id },
		);
		const response = await JRPCRequest(
			dishesByReviewBody,
		);
		const dishReviews: iDishReview[] = JSON.parse(
			response.result,
		);
		setDishReviews(dishReviews);
	};

	useEffect(() => {
		updateDishReviews(review.uuid);
	}, [review]);

	const toggleSubRow = () => {
		console.log('click');
		const rowToInsertAfter = document.getElementById(
			`tr-${review.uuid}`,
		);

		if (rowToInsertAfter) {
			if (isExpanded) {
				const existingRow = document.getElementById(
					`tsr-${review.uuid}`,
				);
				if (existingRow) {
					existingRow.remove();
				}
			} else {
				const newRow = document.createElement('tr');
				newRow.id = `tsr-${review.uuid}`;
				const newCell =
					document.createElement('td');
				newCell.colSpan = 100;
				newCell.className = 'px-4 py-4';

				const root = createRoot(newCell);
				root.render(
					<ReviewDetailTable
						review={review}
						dishReviews={dishReviews}
					/>,
				);

				newRow.appendChild(newCell);
				rowToInsertAfter.insertAdjacentElement(
					'afterend',
					newRow,
				);
			}

			setIsExpanded(!isExpanded);
		}
	};

	return (
		<Button
			onClick={toggleSubRow}
			size='sm'
			variant='light'
			isIconOnly
		>
			{isExpanded ? (
				<FontAwesomeIcon icon={faCircleChevronUp} />
			) : (
				<FontAwesomeIcon
					icon={faCircleChevronDown}
				/>
			)}
		</Button>
	);
};

const ReviewTable = () => {
	const [pageIndex, setPageIndex] = React.useState(1);
	const rowsPerPage = 12;
	const [reviews, setReviews] = useState<iReview[]>([]);
	const [dishNamesByReview, setDishNamesByReview] =
		useState<Map<string, string[]>>(new Map());
	const [filter, setFilter] = React.useState('');
	const [mode, setMode] = React.useState<NormMode>('raw');
	const [sortDescriptor, setSortDescriptor] =
		React.useState<SortDescriptor>({
			column: 'date',
			direction: 'descending',
		});

	const focusUuid = useSearchParams().get('focus');
	const focusHandled = useRef<string | null>(null);

	// Normalization is per-reviewer, so it must run over the whole
	// dataset before filtering/sorting narrows it down.
	const normalizedReviews = useMemo(() => {
		if (mode === 'minmax')
			return normalizeReviews(reviews) as iReview[];
		if (mode === 'rank')
			return rankNormalizeReviews(
				reviews,
			) as iReview[];
		return reviews;
	}, [mode, reviews]);

	const suffix = NORM_SUFFIX[mode];

	const cycleMode = () =>
		setMode(
			(m) =>
				NORM_ORDER[
					(NORM_ORDER.indexOf(m) + 1) %
						NORM_ORDER.length
				],
		);

	// Dish names aren't on the review itself (they're a separate table),
	// so fetch them once per review batch to support `dish:` search terms.
	useEffect(() => {
		if (reviews.length === 0) {
			setDishNamesByReview(new Map());
			return;
		}
		let cancelled = false;
		(async () => {
			const dishReviews = await fetchDishReviews(
				reviews,
			);
			if (cancelled) return;
			const map = new Map<string, string[]>();
			for (const d of dishReviews) {
				const list = map.get(d.review_id) ?? [];
				list.push(d.dish);
				map.set(d.review_id, list);
			}
			setDishNamesByReview(map);
		})();
		return () => {
			cancelled = true;
		};
	}, [reviews]);

	const searchTokens = useMemo(
		() => parseSearchQuery(filter),
		[filter],
	);

	const filteredReviews = useMemo(() => {
		let result = normalizedReviews;
		if (searchTokens.length > 0) {
			result = result.filter((review: iReview) => {
				const dishNames =
					dishNamesByReview.get(review.uuid) ??
					[];
				return searchTokens.every(
					({ field, term }) => {
						const re = safeRegex(term);
						if (!re) return true;
						if (field === 'reviewer')
							return re.test(review.reviewer);
						if (field === 'restaurant')
							return re.test(
								review.restaurant,
							);
						if (field === 'dish')
							return dishNames.some((d) =>
								re.test(d),
							);
						return (
							re.test(
								reviewToString(review),
							) ||
							dishNames.some((d) =>
								re.test(d),
							)
						);
					},
				);
			});
		}

		const dir =
			sortDescriptor.direction === 'ascending'
				? 1
				: -1;
		result = [...result].sort((a, b) => {
			if (sortDescriptor.column === 'score') {
				return (a.score - b.score) * dir;
			}
			return (
				(a.unixTimestamp - b.unixTimestamp) * dir
			);
		});
		return result;
	}, [
		normalizedReviews,
		searchTokens,
		dishNamesByReview,
		sortDescriptor,
	]);

	const visibleRows = React.useMemo(() => {
		return filteredReviews.slice(
			(pageIndex - 1) * rowsPerPage,
			pageIndex * rowsPerPage,
		);
	}, [pageIndex, rowsPerPage, filteredReviews]);

	const pageLimit = React.useMemo(() => {
		return Math.max(
			1,
			Math.ceil(filteredReviews.length / rowsPerPage),
		);
	}, [rowsPerPage, filteredReviews]);

	const tableRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		getReviews();
	}, []);

	useEffect(() => {
		if (tableRef.current) {
			const elements =
				tableRef.current.querySelectorAll(
					'[id^="tsr-"]',
				);
			elements.forEach((el) => {
				console.log(el);
				el.remove();
			});
		}
	}, [visibleRows]);

	useEffect(() => {
		if (!focusUuid || filteredReviews.length === 0)
			return;
		if (focusHandled.current === focusUuid) return;
		const idx = filteredReviews.findIndex(
			(r) => r.uuid === focusUuid,
		);
		if (idx === -1) return;
		setPageIndex(Math.trunc(idx / rowsPerPage) + 1);
	}, [focusUuid, filteredReviews, rowsPerPage]);

	useEffect(() => {
		if (
			!focusUuid ||
			focusHandled.current === focusUuid
		)
			return;
		if (!visibleRows.some((r) => r.uuid === focusUuid))
			return;
		const row = document.getElementById(
			`tr-${focusUuid}`,
		);
		if (!row) return;
		focusHandled.current = focusUuid;
		row.scrollIntoView({
			behavior: 'smooth',
			block: 'center',
		});
		row.classList.add(
			'bg-primary-100',
			'transition-colors',
			'duration-1000',
		);
		setTimeout(() => {
			row.classList.remove('bg-primary-100');
		}, 2500);
	}, [focusUuid, visibleRows]);

	const getReviews = async () => {
		const jsonRPCBody: any = {
			jsonrpc: '2.0',
			method: 'get_reviews',
			params: {},
			id: UUID(),
		};
		try {
			const resp = await fetch(Config.serverIP, {
				method: 'POST',
				mode: 'cors',
				body: JSON.stringify(jsonRPCBody),
				headers: {
					'Content-Type':
						'application/json; charset=UTF-8',
				},
			});
			const result = (await resp.json()).result;
			const reviews: iReview[] = JSON.parse(result);
			reviews.sort(
				(a, b) => b.unixTimestamp - a.unixTimestamp,
			);
			setReviews(reviews);
		} catch (error) {
			console.log(error);
		}
	};

	const handleChangePageIndex = (
		newPageIndex: number,
	) => {
		setPageIndex(Math.min(newPageIndex, pageLimit));
	};

	// Avoid a layout jump when reaching the last page with empty rows.
	const emptyRows =
		pageIndex > 0
			? Math.max(
					0,
					(1 + pageIndex) * rowsPerPage -
						filteredReviews.length,
			  )
			: 0;

	function reviewToString(review: iReview) {
		return [
			review.reviewer,
			review.restaurant,
			review.comment,
			review.score,
			dayjs
				.unix(review.unixTimestamp)
				.tz('America/Vancouver')
				.format('YYYY-MM-DD HH:mm'),
		].join('\n');
	}

	return (
		<div className='text-xl w-full'>
			<div className='flex flex-row items-end gap-2'>
				<Input
					fullWidth
					label='Search Field'
					id='Search Field'
					placeholder='Search Field'
					value={filter}
					size='sm'
					onChange={(
						event: React.ChangeEvent<HTMLInputElement>,
					) => {
						setFilter(event.target.value);
						setPageIndex(1);
					}}
				/>
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
					className='h-12 shrink-0'
					onPress={cycleMode}
				>
					{NORM_LABEL[mode]}
				</Button>
			</div>
			<div className='text-xs text-default-400 mt-1'>
				{
					"Subfield search: '(reviewer|restaurant|dish):string'."
				}
			</div>
			<Table
				aria-label='Review Table'
				className='mt-[2vh]'
				bottomContentPlacement='outside'
				bottomContent={
					<div className='flex w-full justify-center'>
						<Pagination
							isCompact
							showControls
							showShadow
							total={pageLimit}
							initialPage={1}
							page={pageIndex}
							onChange={handleChangePageIndex}
						/>
					</div>
				}
				ref={tableRef}
				sortDescriptor={sortDescriptor}
				onSortChange={(descriptor) => {
					setSortDescriptor(descriptor);
					setPageIndex(1);
				}}
			>
				<TableHeader>
					<TableColumn key='restaurant'>
						Restaurant
					</TableColumn>
					<TableColumn key='reviewer'>
						Reviewer
					</TableColumn>
					<TableColumn key='score' allowsSorting>
						Score{suffix}
					</TableColumn>
					<TableColumn key='date' allowsSorting>
						Date
					</TableColumn>
					<TableColumn key='expand'>
						Expand
					</TableColumn>
				</TableHeader>
				<TableBody items={visibleRows}>
					{(review) => (
						<TableRow
							key={review.uuid}
							id={`tr-${review.uuid}`}
						>
							<TableCell>
								{review.restaurant}
							</TableCell>
							<TableCell>
								{review.reviewer}
							</TableCell>
							<TableCell>
								{mode === 'raw'
									? review.score
									: review.score.toFixed(
											1,
									  )}
							</TableCell>
							<TableCell>
								{dayjs
									.unix(
										review.unixTimestamp,
									)
									.tz('America/Vancouver')
									.format(
										'YYYY-MM-DD HH:mm',
									)}
							</TableCell>
							<TableCell>
								<ToggleSubRowButton
									review={review}
								/>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default ReviewTable;
