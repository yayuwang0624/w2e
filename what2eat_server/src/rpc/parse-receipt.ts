import Anthropic from '@anthropic-ai/sdk';
import { ErrorResponse } from '../interface/response';
import { RestaurantRepo, DishRepo } from '../data-source';
import { ensureActiveUser } from '../auth/require-auth';

// Swap the model without touching code: set RECEIPT_MODEL on the server.
// Haiku is plenty for receipts and the cheapest; bump to
// claude-sonnet-5 / claude-opus-4-8 if photos are consistently messy.
const MODEL = process.env.RECEIPT_MODEL || 'claude-haiku-4-5';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

interface ReceiptItem {
	nameCn: string;
	nameEn: string;
	qty: number;
	price: number;
	isNew: boolean;
}

interface ReceiptDraft {
	restaurant: string;
	matchedExisting: boolean;
	datetime: string; // naive local "YYYY-MM-DDTHH:mm:ss" or ""
	people: number;
	price: number;
	items: ReceiptItem[];
}

const DRAFT_SCHEMA = {
	type: 'object',
	additionalProperties: false,
	properties: {
		restaurant: { type: 'string' },
		matchedExisting: { type: 'boolean' },
		datetime: { type: 'string' },
		people: { type: 'integer' },
		price: { type: 'number' },
		items: {
			type: 'array',
			items: {
				type: 'object',
				additionalProperties: false,
				properties: {
					nameCn: { type: 'string' },
					nameEn: { type: 'string' },
					qty: { type: 'integer' },
					price: { type: 'number' },
					isNew: { type: 'boolean' },
				},
				required: [
					'nameCn',
					'nameEn',
					'qty',
					'price',
					'isNew',
				],
			},
		},
	},
	required: [
		'restaurant',
		'matchedExisting',
		'datetime',
		'people',
		'price',
		'items',
	],
} as const;

const buildPrompt = (existingNames: string[]) => `You are reading a restaurant receipt photo for a dining-log app.

Extract the meal into structured data. Follow these rules:

- restaurant: Match the receipt's restaurant to the CLOSEST name in the existing list below and return that exact string, setting matchedExisting=true. Existing names often carry a Chinese name plus an English name — return the whole string verbatim. If nothing matches, return the restaurant as printed and set matchedExisting=false.
- datetime: The receipt's date and time as "YYYY-MM-DDTHH:mm:ss" (24h, no timezone). If only a date is shown, use "T00:00:00". If none, return "".
- price: The GRAND TOTAL including tax (the final amount paid). A number, e.g. 100.76.
- people: Party size if the receipt states it; otherwise 0.
- items: One entry per line item that is an actual dish. Skip pure staples like plain rice unless it's clearly a dish.
  - nameCn: the FULL proper Chinese dish name. Receipts abbreviate ("Fr Yellow Beef", "Steam Ck w Chilli Sa") — expand to the real name (金牌小炒黄牛肉, 口水鸡). If a Chinese name is printed, prefer it.
  - nameEn: a clean English name (expand the abbreviation).
  - qty: quantity for that line.
  - price: line total.
  - isNew: set false; the server recomputes this.

Existing restaurants:
${existingNames.map((n) => `- ${n}`).join('\n')}`;

export const ParseReceipt = async (
	params: {
		image?: string; // base64, no data-URL prefix
		mediaType?: string; // e.g. "image/jpeg"
		token?: string;
	},
	callback: (e: ErrorResponse | null, m?: string) => void,
) => {
	const user = await ensureActiveUser(
		params.token,
		callback,
	);
	if (!user) return;
	if (user.role !== 'admin') {
		return callback(
			new ErrorResponse(
				403,
				'receipt scanning is admin-only',
			),
		);
	}

	if (!params.image) {
		return callback(
			new ErrorResponse(400, 'no image provided'),
		);
	}

	try {
		const restaurants = await RestaurantRepo.find();
		const existingNames = restaurants.map((r) => r.name);

		const media = (params.mediaType ||
			'image/jpeg') as
			| 'image/jpeg'
			| 'image/png'
			| 'image/gif'
			| 'image/webp';

		const resp = await client.messages.create({
			model: MODEL,
			max_tokens: 2048,
			output_config: {
				format: {
					type: 'json_schema',
					schema: DRAFT_SCHEMA as any,
				},
			},
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'image',
							source: {
								type: 'base64',
								media_type: media,
								data: params.image,
							},
						},
						{
							type: 'text',
							text: buildPrompt(existingNames),
						},
					],
				},
			],
		} as any);

		const textBlock = resp.content.find(
			(b: any) => b.type === 'text',
		) as { text: string } | undefined;
		if (!textBlock) {
			return callback(
				new ErrorResponse(
					502,
					'model returned no text',
				),
			);
		}

		const draft: ReceiptDraft = JSON.parse(
			textBlock.text,
		);

		// Authoritative new/existing check against the DB for the
		// matched restaurant (don't trust the model's isNew).
		const existingDishes = new Set(
			(
				await DishRepo.find({
					where: { restaurant: draft.restaurant },
				})
			).map((d) => d.name),
		);
		draft.items = (draft.items || []).map((it) => ({
			...it,
			isNew: !existingDishes.has(it.nameCn),
		}));

		callback(null, JSON.stringify(draft));
	} catch (err: any) {
		console.error('parse_receipt failed', err);
		callback(
			new ErrorResponse(
				500,
				`receipt parsing failed: ${err?.message || err}`,
			),
		);
	}
};
