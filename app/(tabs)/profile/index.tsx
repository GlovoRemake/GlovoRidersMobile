import { router } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, KeyRound, LogOut, MapPin, Pencil } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { useGetProfileQuery } from "@/store/service/apiAccount";
import { deleteSecureStore } from "@/utils/secureStore";
import APP_ENV from "@/utils/env";

const PRIMARY = "#FFC244";

export default function ProfileScreen() {
    const { data: profile, isLoading, isError } = useGetProfileQuery();

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-black">
                <ActivityIndicator size="large" color={PRIMARY} />
            </View>
        );
    }

    if (isError || !profile) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6 dark:bg-black">
                <Text className="text-center text-base text-gray-500 dark:text-gray-400">
                    Не вдалося завантажити профіль
                </Text>
                <Button
                    className="mt-5 h-14 flex-row items-center justify-center rounded-2xl bg-white dark:bg-zinc-900"
                    onPress={() => {
                        deleteSecureStore("accessToken");
                        deleteSecureStore("refreshToken");
                        router.replace("/(auth)/login");
                    }}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text className="ml-2 text-base font-bold text-red-500">
                        Вийти з акаунта
                    </Text>
                </Button>
            </View>
        );
    }

    const fullName = `${profile.firstName} ${profile.lastName}`.trim();

    return (
        <ScrollView
            className="flex-1 bg-gray-50 dark:bg-black"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
        >
            <View className="px-5 pt-20">
                <Text className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                    Профіль
                </Text>

                <View className="overflow-hidden rounded-[28px] bg-white dark:bg-zinc-900">
                    <View className="h-24" style={{ backgroundColor: PRIMARY }}>
                        <Pressable
                            className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full border border-black/10"
                            onPress={() => router.push("/(tabs)/profile/updateProfile")}
                        >
                            <Pencil size={18} color="#111827" />
                        </Pressable>
                    </View>

                    <View className="px-5 pb-5">
                        <View className="-mt-12 mb-4">
                            <View className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-100 dark:border-zinc-900">
                                {profile.avatarPath ? (
                                    <Image
                                        source={{ uri: `${APP_ENV.API_IMAGE_LARGE_URL}${profile.avatarPath}` }}
                                        className="h-full w-full"
                                    />
                                ) : (
                                    <View className="h-full w-full items-center justify-center bg-[#FFE7A8]">
                                        <Text className="text-3xl font-bold text-gray-900">
                                            {profile.firstName?.[0]}
                                            {profile.lastName?.[0]}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {fullName}
                        </Text>
                        <Text className="mt-1 text-base text-gray-500 dark:text-gray-400">
                            {profile.phone}
                        </Text>
                    </View>
                </View>

                <Button
                    className="mt-5 h-14 flex-row items-center justify-center rounded-2xl bg-white dark:bg-zinc-900"
                    onPress={() => {
                        deleteSecureStore("accessToken");
                        deleteSecureStore("refreshToken");
                        router.replace("/(auth)/login");
                    }}
                >
                    <LogOut size={20} color="#EF4444" />
                    <Text className="ml-2 text-base font-bold text-red-500">
                        Вийти з акаунта
                    </Text>
                </Button>
            </View>
        </ScrollView>
    );
}

function Divider() {
    return <View className="ml-[68px] h-px bg-gray-100 dark:bg-zinc-800" />;
}

interface ProfileRowProps {
    icon: React.ReactNode;
    iconBackground: string;
    title: string;
    subtitle: string;
}

function ProfileRow({ icon, iconBackground, title, subtitle }: ProfileRowProps) {
    return (
        <Pressable
            className="flex-row items-center px-4 py-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
        >
            <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: iconBackground }}
            >
                {icon}
            </View>
            <View className="ml-3 flex-1">
                <Text className="text-[15px] font-bold text-gray-900 dark:text-white">
                    {title}
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {subtitle}
                </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>
    );
}
