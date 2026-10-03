import {createApi} from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/utils/fetchBaseQuery";
import {IOrder} from "@/types/order/IOrder";

export const apiOrders = createApi({
    reducerPath: 'apiOrders',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Orders'],
    endpoints: (builder) => ({
        getOrders: builder.query<IOrder[], {latitude: number; longitude: number;}>({
            query: (data) => `/Order/order-for-courier?latitude=${data.latitude}&longitude=${data.longitude}`,
            providesTags: ["Orders"],
        }),
        acceptOrder: builder.mutation<IOrder, number>({
            query: (orderId) => ({
                url: `/Order/courier-accept?orderId=${orderId}`,
                method: 'POST',
            }),
            invalidatesTags: ["Orders"]
        }),
        currentOrder: builder.query<IOrder, void>({
            query: (data) => `/Order/courier-order`,
            providesTags: ["Orders"],
        }),
        confirmDelivery: builder.mutation<void, number>({
            query: (orderId) => ({
                url: `/Order/confirm-delivery?orderId=${orderId}`,
                method: 'POST',
            }),
            invalidatesTags: ["Orders"]
        }),
    }),
});


export const {
    useGetOrdersQuery,
    useAcceptOrderMutation,
    useCurrentOrderQuery,
    useConfirmDeliveryMutation,
} = apiOrders;