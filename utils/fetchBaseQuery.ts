import {
    BaseQueryApi,
    BaseQueryFn,
    FetchArgs,
    FetchBaseQueryError,
    FetchBaseQueryMeta,
    QueryReturnValue,
    fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { saveSecureStore, deleteSecureStore, getSecureStore } from "@/utils/secureStore";

import APP_ENV from "./env";
import { RootState } from "@/store";
import {
    logout,
    setAccessToken,
    setRefreshToken,
} from "@/store/slices/authSlice";

import { ApiResponse } from "@/types/api/ApiResponse";
import { ITokensResponse } from "@/types/token/ITokensResponse";

interface CustomFetchArgs extends FetchArgs {
    meta?: {
        isBlob?: boolean;
    };
}

type BaseQueryResult = QueryReturnValue<
    unknown,
    FetchBaseQueryError,
    FetchBaseQueryMeta
>;

const baseQuery = fetchBaseQuery({
    baseUrl: `${APP_ENV.API_URL}/api`,
    prepareHeaders(headers, { getState }) {
        const token = getSecureStore("accessToken");

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        return headers;
    },
});

let refreshPromise: Promise<BaseQueryResult> | null = null;

let redirecting = false;

export const baseQueryWithReauth: BaseQueryFn<
    string | CustomFetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const isBlob =
        typeof args !== "string" &&
        args.meta?.isBlob === true;

    let result = await baseQuery(
        isBlob
            ? {
                ...args,
                responseHandler: (response) => response.blob(),
            }
            : args,
        api,
        extraOptions
    );

    if (result.error?.status !== 401) {
        return normalizeResult(result, isBlob);
    }

    const isRefreshRequest =
        typeof args !== "string" &&
        args.url.includes("/Account/Refresh");

    if (isRefreshRequest) {
        logoutAndRedirect(api);
        return result;
    }

    const refreshToken = getSecureStore("refreshToken");

    if (!refreshToken) {
        logoutAndRedirect(api);
        return result;
    }

    if (!refreshPromise) {
        refreshPromise = Promise.resolve(
            baseQuery(
                {
                    url: "/Account/Refresh",
                    method: "POST",
                    body: {
                        Token: refreshToken,
                    },
                },
                api,
                extraOptions
            )
        );

        refreshPromise.finally(() => {
            refreshPromise = null;
        });
    }

    const refreshResult = await refreshPromise;

    const refreshData = refreshResult.data as
        | ApiResponse<ITokensResponse>
        | undefined;

    if (!refreshData?.isSuccess || !refreshData.value) {
        logoutAndRedirect(api);

        return {
            error: {
                status: 401,
                data: "Refresh token expired",
            },
        };
    }

    api.dispatch(setAccessToken(refreshData.value.accessToken));
    api.dispatch(setRefreshToken(refreshData.value.refreshToken));

    saveSecureStore("refreshToken", refreshData.value.refreshToken)

    result = await baseQuery(args, api, extraOptions);

    return normalizeResult(result, isBlob);
};

function normalizeResult(
    result: BaseQueryResult,
    isBlob: boolean
): BaseQueryResult {
    if (isBlob) return result;

    if (!result.data) return result;

    const response = result.data as ApiResponse<unknown>;

    if (
        typeof response === "object" &&
        response !== null &&
        "isSuccess" in response
    ) {
        if (!response.isSuccess) {
            return {
                error: {
                    status: 400,
                    data: response.errors,
                },
            };
        }

        return {
            data: response.value,
        };
    }

    return result;
}

function logoutAndRedirect(api: BaseQueryApi): void {
    api.dispatch(logout());

    deleteSecureStore("accessToken");
    deleteSecureStore("refreshToken");

    if (typeof window === "undefined") {
        return;
    }

    if (redirecting) {
        return;
    }

    redirecting = true;

    window.location.replace("/auth/login");
}