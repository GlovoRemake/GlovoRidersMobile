import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, Camera, Check, User } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useGetProfileQuery,
    useUpdateProfileMutation,
} from "@/store/service/apiAccount";
import { IUpdateProfile } from "@/types/account/IUpdateProfile";
import APP_ENV from "@/utils/env";

const PRIMARY = "#FFC244";

const colors = {
    light: {
        background: "#F9FAFB",
        card: "#FFFFFF",
        text: "#111827",
        secondaryText: "#6B7280",
        mutedText: "#9CA3AF",
        divider: "#F3F4F6",
        avatarBackground: "#FFF4D6",
        avatarIcon: "#8A6A1F",
        headerIconBackground: "#FFFFFF",
        inputBackground: "#FFFFFF",
        buttonText: "#111827",
    },
    dark: {
        background: "#09090B",
        card: "#18181B",
        text: "#FAFAFA",
        secondaryText: "#A1A1AA",
        mutedText: "#71717A",
        divider: "#27272A",
        avatarBackground: "#3F351D",
        avatarIcon: "#FFC244",
        headerIconBackground: "#18181B",
        inputBackground: "#18181B",
        buttonText: "#111827",
    },
};

export default function UpdateProfileScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === "dark" ? colors.dark : colors.light;
    const { data: profile, isLoading: isProfileLoading } = useGetProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
    const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(null);
    const avatarUri =
        selectedAvatarUri ??
        (profile?.avatarPath
            ? `${APP_ENV.API_IMAGE_LARGE_URL}${profile.avatarPath}`
            : null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<IUpdateProfile>({
        defaultValues: {
            firstName: "",
            lastName: "",
            phone: "",
            avatar: null,
        },
    });

    useEffect(() => {
        if (!profile) return;

        reset({
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            phone: profile.phone ?? "",
            avatar: null,
        });
    }, [profile, reset]);

    const pickAvatar = async (
        onChange: (value: IUpdateProfile["avatar"]) => void,
    ) => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        const extension =
            asset.fileName?.split(".").pop()?.toLowerCase() || "jpg";
        const mimeType =
            asset.mimeType ||
            (extension === "png" ? "image/png" : "image/jpeg");

        setSelectedAvatarUri(asset.uri);
        onChange({
            uri: asset.uri,
            name: asset.fileName || `avatar.${extension}`,
            type: mimeType,
        });
    };

    const onSubmit = async (values: IUpdateProfile) => {
        await updateProfile(values).unwrap();
        router.back();
    };

    if (isProfileLoading) {
        return (
            <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: theme.background }}
            >
                <ActivityIndicator size="large" color={PRIMARY} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: theme.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="px-5 pt-14 pb-10"
            >
                <View className="mb-8 flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="mr-4 h-11 w-11 items-center justify-center rounded-full"
                        style={({ pressed }) => ({
                            backgroundColor: theme.headerIconBackground,
                            opacity: pressed ? 0.6 : 1,
                        })}
                    >
                        <ArrowLeft size={22} color={theme.text} />
                    </Pressable>
                    <Text
                        className="text-3xl font-extrabold"
                        style={{ color: theme.text }}
                    >
                        Редагування
                    </Text>
                </View>

                <Controller
                    control={control}
                    name="avatar"
                    render={({ field: { onChange } }) => (
                        <View className="mb-8 items-center">
                            <Pressable
                                onPress={() => pickAvatar(onChange)}
                                className="relative"
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.75 : 1,
                                })}
                            >
                                <View
                                    className="h-32 w-32 overflow-hidden rounded-full border-4"
                                    style={{
                                        backgroundColor: theme.avatarBackground,
                                        borderColor: theme.card,
                                    }}
                                >
                                    {avatarUri ? (
                                        <Image
                                            source={{ uri: avatarUri }}
                                            className="h-full w-full"
                                        />
                                    ) : (
                                        <View className="h-full w-full items-center justify-center">
                                            <User
                                                size={52}
                                                color={theme.avatarIcon}
                                            />
                                        </View>
                                    )}
                                </View>
                                <View
                                    className="absolute bottom-0 right-0 h-11 w-11 items-center justify-center rounded-full border-4"
                                    style={{
                                        backgroundColor: PRIMARY,
                                        borderColor: theme.background,
                                    }}
                                >
                                    <Camera size={19} color="#111827" />
                                </View>
                            </Pressable>
                            <Text
                                className="mt-3 text-sm font-semibold"
                                style={{ color: theme.secondaryText }}
                            >
                                Змінити фото
                            </Text>
                        </View>
                    )}
                />

                <Text
                    className="mb-3 text-lg font-bold"
                    style={{ color: theme.text }}
                >
                    Особиста інформація
                </Text>

                <View
                    className="rounded-[24px] p-4"
                    style={{ backgroundColor: theme.card }}
                >
                    <ProfileInput
                        control={control}
                        name="firstName"
                        label="Ім&apos;я"
                        placeholderTextColor={theme.mutedText}
                        inputBackground={theme.inputBackground}
                        rules={{
                            required: "Введіть ім'я",
                            minLength: {
                                value: 2,
                                message: "Ім'я має містити мінімум 2 символи",
                            },
                        }}
                        error={errors.firstName?.message}
                    />
                    <View
                        className="my-4 h-px"
                        style={{ backgroundColor: theme.divider }}
                    />
                    <ProfileInput
                        control={control}
                        name="lastName"
                        label="Прізвище"
                        placeholderTextColor={theme.mutedText}
                        inputBackground={theme.inputBackground}
                        rules={{
                            required: "Введіть прізвище",
                            minLength: {
                                value: 2,
                                message: "Прізвище має містити мінімум 2 символи",
                            },
                        }}
                        error={errors.lastName?.message}
                    />
                    <View
                        className="my-4 h-px"
                        style={{ backgroundColor: theme.divider }}
                    />
                    <ProfileInput
                        control={control}
                        name="phone"
                        label="Номер телефону"
                        keyboardType="phone-pad"
                        placeholderTextColor={theme.mutedText}
                        inputBackground={theme.inputBackground}
                        rules={{
                            required: "Введіть номер телефону",
                            pattern: {
                                value: /^\+?[0-9\s\-()]{10,18}$/,
                                message: "Некоректний номер телефону",
                            },
                        }}
                        error={errors.phone?.message}
                    />
                </View>

                <Button
                    disabled={isUpdating}
                    onPress={handleSubmit(onSubmit)}
                    className="mt-7 h-16 flex-row items-center justify-center rounded-[20px]"
                    style={{ backgroundColor: PRIMARY }}
                >
                    {isUpdating ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <>
                            <Check size={20} color={theme.buttonText} />
                            <Text className="ml-2 text-base font-bold">
                                Зберегти зміни
                            </Text>
                        </>
                    )}
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

type ProfileInputProps = {
    control: ReturnType<typeof useForm<IUpdateProfile>>["control"];
    name: "firstName" | "lastName" | "phone";
    label: string;
    placeholderTextColor: string;
    inputBackground: string;
    keyboardType?: "default" | "phone-pad";
    rules: object;
    error?: string;
};

function ProfileInput({
    control,
    name,
    label,
    placeholderTextColor,
    inputBackground,
    keyboardType,
    rules,
    error,
}: ProfileInputProps) {
    return (
        <View>
            <Text className="mb-1 text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                {label}
            </Text>
            <Controller
                control={control}
                name={name}
                rules={rules}
                render={({ field: { value, onChange, onBlur } }) => (
                    <>
                        <Input
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            keyboardType={keyboardType}
                            style={{ backgroundColor: inputBackground }}
                            placeholderTextColor={placeholderTextColor}
                        />
                        {error && (
                            <View className="mt-1 flex-row items-center">
                                <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                    !
                                </Text>
                                <Text className="text-xs font-nunito-semibold text-red-500">
                                    {error}
                                </Text>
                            </View>
                        )}
                    </>
                )}
            />
        </View>
    );
}
