import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { ChevronLeft, Wallet } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HistoryOrderRow, HistoryOrder } from "../../components/ui/custom/OrderCards";
import { GREEN, PRIMARY, money } from "@/components/food/theme";
import {Button} from "@/components/ui/button";

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

const RECENT: HistoryOrder[] = [
    { id: "1", restaurant: "McDonald's", date: "27 вер", time: "14:20", earned: 65, status: "completed" },
    { id: "2", restaurant: "KFC", date: "27 вер", time: "12:05", earned: 78, status: "completed" },
    { id: "3", restaurant: "Miss Melissa", date: "26 вер", time: "19:15", earned: 58, status: "completed" },
];

export default function EarningsScreen() {
    const insets = useSafeAreaInsets();
    const [period, setPeriod] = React.useState(1);
    const maxValue = Math.max(...WEEK.map((d) => d.value));
    const weekTotal = WEEK.reduce((sum, d) => sum + d.value, 0);

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
                    <View className="flex-row items-center">
                        <Button onPress={() => router.back()}>
                            <ChevronLeft size={22} color="#111827" />
                        </Button>

                        <Text className="ml-3 text-2xl font-extrabold text-gray-900 dark:text-white">
                            Заробіток
                        </Text>
                    </View>

                    {/* Period tabs */}
                    <View className="mt-4 flex-row rounded-2xl bg-gray-100 p-1 dark:bg-zinc-900">
                        {PERIODS.map((label, index) => {
                            const active = index === period;
                            return (
                                <Pressable
                                    key={label}
                                    onPress={() => setPeriod(index)}
                                    className="flex-1 items-center rounded-xl py-2.5"
                                    style={{ backgroundColor: active ? "#FFFFFF" : "transparent" }}
                                >
                                    <Text
                                        className={`text-sm ${
                                            active
                                                ? "font-bold text-gray-900 dark:text-black"
                                                : "text-gray-500 dark:text-gray-400"
                                        }`}
                                    >
                                        {label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Total */}
                    <View
                        className="mt-5 rounded-3xl px-5 py-5"
                        style={{ backgroundColor: PRIMARY }}
                    >
                        <View className="flex-row items-center justify-between">
                            <View>
                                <Text className="text-sm font-semibold text-gray-800/80">
                                    Заробіток за тиждень
                                </Text>
                                <Text className="mt-1 text-3xl font-extrabold text-gray-900">
                                    {money(weekTotal)}
                                </Text>
                            </View>

                            <View className="h-12 w-12 items-center justify-center rounded-full bg-white/40">
                                <Wallet size={22} color="#111827" />
                            </View>
                        </View>
                    </View>

                    {/* Week chart */}
                    <View className="mt-6 flex-row items-end justify-between rounded-2xl bg-gray-50 px-4 pb-3 pt-6 dark:bg-zinc-900" style={{ height: 160 }}>
                        {WEEK.map((d) => {
                            const barHeight = 8 + (d.value / maxValue) * 96;
                            const isToday = d.day === "Нд";
                            return (
                                <View key={d.day} className="items-center" style={{ width: 28 }}>
                                    <View
                                        className="w-full rounded-full"
                                        style={{
                                            height: barHeight,
                                            backgroundColor: isToday ? GREEN : "#D9D9D9",
                                        }}
                                    />
                                    <Text className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                        {d.day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Quick stats */}
                    <View className="mt-5 flex-row" style={{ gap: 10 }}>
                        <MiniStat label="Замовлень" value="34" />
                        <MiniStat label="Годин на лінії" value="28,5" />
                        <MiniStat label="В сер. за замовлення" value={money(78)} />
                    </View>
                </View>

                {/* Recent payouts */}
                <Text className="mb-1 mt-7 px-5 text-lg font-bold text-gray-900 dark:text-white">
                    Останні виплати
                </Text>

                {RECENT.map((order) => (
                    <HistoryOrderRow key={order.id} order={order} />
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
