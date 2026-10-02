import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { HistoryOrderRow, HistoryOrder } from "../../components/ui/custom/OrderCards";
import {Button} from "@/components/ui/button";

const TABS = ["Всі", "Завершені", "Скасовані"];

const HISTORY: { date: string; orders: HistoryOrder[] }[] = [
    {
        date: "Сьогодні, 27 вересня",
        orders: [
            {
                id: "1",
                restaurant: "McDonald's",
                date: "27 вер",
                time: "14:20",
                earned: 65,
                status: "completed",
            },
            {
                id: "2",
                restaurant: "KFC",
                date: "27 вер",
                time: "12:05",
                earned: 78,
                status: "completed",
            },
            {
                id: "3",
                restaurant: "Doner Time",
                date: "27 вер",
                time: "10:40",
                earned: 0,
                status: "cancelled",
            },
        ],
    },
    {
        date: "Вчора, 26 вересня",
        orders: [
            {
                id: "4",
                restaurant: "Miss Melissa",
                date: "26 вер",
                time: "19:15",
                earned: 58,
                status: "completed",
            },
            {
                id: "5",
                restaurant: "Andrew's",
                date: "26 вер",
                time: "13:50",
                earned: 71,
                status: "completed",
            },
        ],
    },
];

export default function OrderHistoryScreen() {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = React.useState(0);

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
                <View className="flex-row items-center">
                    <Button onPress={() => router.back()}>
                        <ChevronLeft size={22} color="#111827" />
                    </Button>

                    <Text className="ml-3 text-2xl font-extrabold text-gray-900 dark:text-white">
                        Історія замовлень
                    </Text>
                </View>

                <View className="mt-4 flex-row" style={{ gap: 8 }}>
                    {TABS.map((tab, index) => {
                        const active = index === activeTab;
                        return (
                            <Pressable
                                key={tab}
                                onPress={() => setActiveTab(index)}
                                className="rounded-full px-4 py-2"
                                style={{ backgroundColor: active ? "#111827" : "#F3F4F6" }}
                            >
                                <Text
                                    className={`text-sm font-semibold ${
                                        active ? "text-white" : "text-gray-600 dark:text-gray-300"
                                    }`}
                                >
                                    {tab}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
                {HISTORY.map((group) => (
                    <View key={group.date}>
                        <Text className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            {group.date}
                        </Text>

                        {group.orders.map((order) => (
                            <HistoryOrderRow key={order.id} order={order} />
                        ))}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
