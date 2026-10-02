import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { ChevronLeft, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HistoryOrderRow, HistoryOrder } from "../../components/ui/custom/OrderCards";
import { GREEN, PRIMARY, money } from "@/components/food/theme";
import {Button} from "@/components/ui/button";
import {useGetPaymentsQuery} from "@/store/service/apiAccount";

const PERIODS = ["Сьогодні", "Тиждень", "Місяць"];

const WEEK = [
    { day: "Пн", value: 620 },
    { day: "Вт", value: 480 },
    { day: "Ср", value: 710 },
    { day: "Чт", value: 390 },
    { day: "Пт", value: 890 },
    { day: "Сб", value: 1040 },
    { day: "Нд", value: 842 },
];

export default function EarningsScreen() {
    const insets = useSafeAreaInsets();
    const [period, setPeriod] = React.useState(1);
    const maxValue = Math.max(...WEEK.map((d) => d.value));
    const weekTotal = WEEK.reduce((sum, d) => sum + d.value, 0);

    const {data} = useGetPaymentsQuery();

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
                    <View className="flex-row items-center">
                        <Text className="ml-3 text-2xl font-extrabold text-gray-900 dark:text-white">
                            Заробіток
                        </Text>
                    </View>

                    {/* Total */}
                    <View
                        className="mt-5 rounded-3xl px-5 py-5"
                        style={{ backgroundColor: PRIMARY }}
                    >
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-sm font-semibold text-gray-800/80">
                                    Баланс
                                </Text>
                                <Text className="mt-1 text-3xl font-extrabold text-gray-900">
                                    {money(data?.balance ?? 0)}
                                </Text>
                            </View>

                            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/40">
                                <Wallet size={22} color="#111827" />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent payouts */}
                <Text className="mb-1 mt-7 px-5 text-lg font-bold text-gray-900 dark:text-white">
                    Виплати
                </Text>

                {data?.payments.map((order, index) => (
                    <HistoryOrderRow key={index} order={{
                        restaurant: order.companyName,
                        date: order.createdAt,
                        time: order.createdAt,
                        earned: order.amount,
                    }} />
                ))}
            </ScrollView>
        </View>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <View className="flex-1 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-zinc-900">
            <Text className="text-base font-extrabold text-gray-900 dark:text-white">
                {value}
            </Text>
            <Text className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                {label}
            </Text>
        </View>
    );
}
