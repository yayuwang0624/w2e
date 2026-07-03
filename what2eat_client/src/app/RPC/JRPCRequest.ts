import { Dish, Dining } from '@/app/dining/DishEditor';
import { Restaurant } from '@/app/dining/DiningEditor';
import { Config } from '@/app/config';
import { v4 as UUID } from 'uuid';

export const JRPCBody = (method: string, params?: any) => {
    return {
        jsonrpc: '2.0',
        method: method,
        params: params ? params : {},
        id: UUID(),
    };
};

export const JRPCRequest = async (jsonRPCBody: any) => {
    const response = await fetch(Config.serverIP, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify(jsonRPCBody),
        headers: {
            'Content-Type':
                'application/json; charset=UTF-8',
        },
    });
    return await response.json();
};

export const GetRestaurants = async (
    callback: (restaurants: Restaurant[]) => void,
) => {
    try {
        const getReviewersBody = JRPCBody(
            'get_restaurants',
        );
        const response = await JRPCRequest(
            getReviewersBody,
        );
        const restaurants: Restaurant[] = JSON.parse(
            response.result,
        );
        callback(restaurants);
        return restaurants;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const GetDinings = async (
    callback: (dining: Dining[]) => void,
) => {
    try {
        const getDiningBody = JRPCBody('get_dining');
        const response = await JRPCRequest(getDiningBody);
        const dining: Dining[] = JSON.parse(
            response.result,
        );
        callback(dining);
        return dining;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export interface ReceiptDraftItem {
    nameCn: string;
    nameEn: string;
    qty: number;
    price: number;
    isNew: boolean;
}

export interface ReceiptDraft {
    restaurant: string;
    matchedExisting: boolean;
    datetime: string;
    people: number;
    price: number;
    items: ReceiptDraftItem[];
}

export const ParseReceipt = async (
    image: string,
    mediaType: string,
    token: string | null,
): Promise<ReceiptDraft> => {
    const body = JRPCBody('parse_receipt', {
        image,
        mediaType,
        token,
    });
    const response = await JRPCRequest(body);
    if (response.error) {
        throw new Error(
            response.error.message || 'parse failed',
        );
    }
    return JSON.parse(response.result) as ReceiptDraft;
};

export const GetDishesByRestaurant = async (
    restaurant: string,
) => {
    try {
        const getReviewersBody = JRPCBody(
            'get_dishes_by_restaurant',
            {
                restaurant: restaurant,
            },
        );
        const response = await JRPCRequest(
            getReviewersBody,
        );
        const dishes: Dish[] = JSON.parse(response.result);
        return dishes;
    } catch (error) {
        console.log(error);
        return [];
    }
};
