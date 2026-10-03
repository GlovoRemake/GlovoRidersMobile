import React from "react";
import { View, Text, Pressable } from "react-native";
import { MapPin, Navigation, Clock } from "lucide-react-native";
import { GREEN, PRIMARY, money } from "@/components/food/theme";

/* ------------------------------------------------------------------ */
/* AvailableOrderCard — картка замовлення, доступного для прийняття    */
/* ------------------------------------------------------------------ */
export interface AvailableOrder {
    id: string;
    restaurant: string;
    pickupAddress: string;
    dropoffAddress: string;
    distanceKm: number;
    etaMin: number;
    payout: number;
}

interface AvailableOrderCardProps {
    order: AvailableOrder;
    onAccept?: () => void;
}

export function AvailableOrderCard({ order, onAccept }: AvailableOrderCardProps) {
    return (
        <View
            className="mb-3 rounded-2xl bg-white px-4 py-4 dark:bg-zinc-900"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 2,
            }}
        >
            <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-base font-bold text-gray-900 dark:text-white">
                    {order.restaurant}
                </Text>

                <View
                    className="rounded-lg px-2.5 py-1"
                    style={{ backgroundColor: "#E3F3E9" }}
                >
                    <Text className="text-sm font-extrabold" style={{ color: GREEN }}>
                        {money(order.payout)}
                    </Text>
                </View>
            </View>

            <View className="mt-3">
                <AddressRow icon={<MapPin size={15} color="#6B7280" />} text={order.pickupAddress} />
                <View className="ml-[7px] h-3 w-px bg-gray-200 dark:bg-zinc-700" />
                <AddressRow icon={<Navigation size={15} color="#6B7280" />} text={order.dropoffAddress} />
            </View>

            <View className="mt-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                </View>

                <Pressable
                    onPress={onAccept}
                    className="rounded-xl px-5 py-2.5"
                    style={{ backgroundColor: PRIMARY }}
                >
                    <Text className="text-sm font-bold text-gray-900">Прийняти</Text>
                </Pressable>
            </View>
        </View>
    );
}

function AddressRow({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View className="flex-row items-center">
            {icon}
            <Text className="ml-2 flex-1 text-[13px] text-gray-700 dark:text-gray-300" numberOfLines={1}>
                {text}
            </Text>
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* StatusBadge — «Завершено» / «Скасовано»                             */
/* ------------------------------------------------------------------ */
type OrderStatus = "completed" | "cancelled";

export function StatusBadge({ status }: { status: OrderStatus }) {
    const isCompleted = status === "completed";

    return (
        <View
            className="self-start rounded-lg px-2 py-1"
            style={{ backgroundColor: isCompleted ? "#E3F3E9" : "#FDEAEA" }}
        >
            <Text
                className="text-[11px] font-bold"
                style={{ color: isCompleted ? GREEN : "#E4262C" }}
            >
                {isCompleted ? "Завершено" : "Скасовано"}
            </Text>
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* HistoryOrderRow — рядок в історії замовлень                         */
/* ------------------------------------------------------------------ */
export interface HistoryOrder {
    restaurant: string;
    date: string;
    time: string;
    earned: number;
}

export function HistoryOrderRow({ order }: { order: HistoryOrder }) {
    return (
        <View className="flex-row items-center border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
            <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#FFF4D6" }}
            >
                <Text className="text-lg">🛵</Text>
            </View>

            <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-gray-900 dark:text-white">
                    {order.restaurant}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {order.date} · {order.time}
                </Text>
            </View>

            <Text
                className="text-[15px] font-extrabold"
                style={{ color: GREEN}}
            >
                {`+${money(order.earned)}`}
            </Text>
        </View>
    );
}
