import {ApiError} from "@/types/api/ApiError";

export type ApiResponse<T> =
    | {
    isSuccess: true
    value: T | undefined
}
    | {
    isSuccess: false
    errors: ApiError[]
}